import type {CarriedName} from "../contract/channels.ts";
import * as channels from "../contract/channels.ts";
import {Clock} from "./clock.ts";
import {Relay} from "./relay.ts";
import {AngleDeviationStore, type MirroredAngle} from "./stores/angle-deviation-store.ts";
import {AveragingStore} from "./stores/averaging-store.ts";
import type {CombiningStore} from "./stores/combining-store.ts";
import {ConnectionStore} from "./stores/connection-store.ts";
import {DeviationStore} from "./stores/deviation-store.ts";
import {LatestStore} from "./stores/latest-store.ts";
import type {LimitedStoreProps} from "./stores/limited-store.ts";
import {type PowerPair, PowerStore} from "./stores/power-store.ts";
import {type Axis, QuaternionStore} from "./stores/quaternion-store.ts";
import {SimpleStore} from "./stores/simple-store.ts";
import type {Store} from "./stores/store.ts";
import {SummingStore} from "./stores/summing-store.ts";
import {parseTimedRecords} from "./timed-record.ts";

const FIRST_BACKOFF_MS = 1000;
const LAST_BACKOFF_MS = 30_000;

// The server pings every 15 seconds; twice that lets one ping run late without a reconnect.
const SILENCE_MS = 30_000;

// The most records a chart's store holds; the server's buffer keeps as many per channel.
const CHART_POINTS = 150;

type CombiningStoreClass = new (
  relays: readonly Relay[],
  props: LimitedStoreProps,
) => CombiningStore;

// eslint-disable-next-line no-restricted-syntax -- the stream, its reconnect backoff and watchdog, and the stores it feeds change over the connection's life, and a class is the honest shape for them
export class App {
  // Empty in the page, whose own URL resolves /events; the tests name their server.
  readonly #origin: string;
  readonly #relays = new Map<CarriedName, Relay>();
  readonly #stores = new Map<string, Store<object>>();

  #backoffMs = FIRST_BACKOFF_MS;
  #events: EventSource | undefined;
  #reconnect: ReturnType<typeof setTimeout> | undefined;
  // A proxy can hold a stream open after the server behind it has gone, or accept a
  // connection it never answers, and EventSource reports neither, so a stream silent for
  // SILENCE_MS is dropped.
  #watchdog: ReturnType<typeof setTimeout> | undefined;

  readonly clock = new Clock();
  readonly connection = new ConnectionStore();
  readonly lastTransmission = new LatestStore();

  constructor(origin = "") {
    this.#origin = origin;
  }

  #getCombiningStore(
    combination: string,
    StoreClass: CombiningStoreClass,
    names: readonly CarriedName[],
  ): CombiningStore {
    return this.#held(
      `${combination} ${names.toSorted((a, b) => a.localeCompare(b)).join(",")}`,
      StoreClass,
      () => {
        const relays = names.map((channel) => this.#subscribe(channel));
        return new StoreClass(relays, {maxSize: CHART_POINTS});
      },
    );
  }

  // Returns the store under key, creating it on first use, so views that show the same data
  // share one store. All getters share one key space and a simple store's key is its bare
  // channel name, so a quaternion id equal to a channel name would collide; that throws
  // rather than hand back a store of the wrong class.
  #held<Held extends Store<object>>(
    key: string,
    StoreClass: new (...args: never[]) => Held,
    create: () => Held,
  ): Held {
    const held = this.#stores.get(key);
    if (held instanceof StoreClass) {
      return held;
    }
    if (held !== undefined) {
      throw new Error(`${key} names a ${held.constructor.name} and a ${StoreClass.name}`);
    }
    const store = create();
    this.#stores.set(key, store);
    return store;
  }

  #subscribe(channel: CarriedName): Relay {
    const held = this.#relays.get(channel);
    if (held) {
      return held;
    }
    if (this.#events) {
      throw new Error(
        `subscribed to ${channel} after the event stream opened and sent its history`,
      );
    }

    const relay = new Relay();

    // lastTransmission takes station channels only: the times of the feed's clock and of the
    // server's own STATUS say nothing of when an instrument last reported.
    if (channel !== "TIME_000001" && channel !== "STATUS") {
      relay.register((records) => {
        this.lastTransmission.update(records);
      });
    }

    this.#relays.set(channel, relay);
    return relay;
  }

  connect(): void {
    const events = (this.#events = new EventSource(`${this.#origin}/events`));
    const reconnectLater = () => {
      clearTimeout(this.#watchdog);
      this.#reconnect = setTimeout(() => {
        this.connect();
      }, this.#backoffMs);
      this.#backoffMs = Math.min(this.#backoffMs * 2, LAST_BACKOFF_MS);
    };

    const resetWatchdog = () => {
      clearTimeout(this.#watchdog);
      this.#watchdog = setTimeout(() => {
        events.close();
        this.connection.setState({lost: true});
        reconnectLater();
      }, SILENCE_MS);
    };
    resetWatchdog();

    for (const [channel, relay] of this.#relays) {
      const name = String(channels.numbers[channel]);
      // EventSource hands a message event its data as a string.
      events.addEventListener(name, (event: MessageEvent<string>) => {
        relay.send(parseTimedRecords(event.data));
      });
      events.addEventListener(name, resetWatchdog);
    }
    events.addEventListener("ping", resetWatchdog);
    events.addEventListener("open", () => {
      this.#backoffMs = FIRST_BACKOFF_MS;
      this.connection.setState({lost: false});
      resetWatchdog();
    });

    // events retries a dropped connection by itself but gives up for good on an answer
    // other than 200 with text/event-stream, such as a proxy's 502 while the server restarts.
    events.addEventListener("error", () => {
      this.connection.setState({lost: true});
      if (events.readyState === EventSource.CLOSED) {
        reconnectLater();
      }
    });
  }

  close(): void {
    clearTimeout(this.#reconnect);
    clearTimeout(this.#watchdog);
    this.#events?.close();
  }

  getAveragingStore(names: readonly CarriedName[]): CombiningStore {
    return this.#getCombiningStore("average", AveragingStore, names);
  }

  getAngleDeviationStore(
    angles: readonly MirroredAngle<CarriedName>[],
  ): AngleDeviationStore {
    const names = angles.map(
      ({channel, negated, turned}) => `${String(negated)} ${String(turned)} ${channel}`,
    );
    return this.#held(
      `angle-deviation ${names.toSorted((a, b) => a.localeCompare(b)).join(",")}`,
      AngleDeviationStore,
      () =>
        new AngleDeviationStore(
          angles.map((angle) => ({
            ...angle,
            channel: {
              number: channels.numbers[angle.channel],
              relay: this.#subscribe(angle.channel),
            },
          })),
          {maxSize: CHART_POINTS},
        ),
    );
  }

  getDeviationStore(names: readonly CarriedName[]): CombiningStore {
    return this.#getCombiningStore("deviation", DeviationStore, names);
  }

  getSummingStore(names: readonly CarriedName[]): CombiningStore {
    return this.#getCombiningStore("sum", SummingStore, names);
  }

  getPowerStore(pairs: readonly PowerPair<CarriedName>[]): PowerStore {
    const names = pairs.map(({volts, amps}) => `${volts}*${amps}`);
    return this.#held(
      `power ${names.toSorted((a, b) => a.localeCompare(b)).join(",")}`,
      PowerStore,
      () => {
        const channel = (name: CarriedName) => ({
          number: channels.numbers[name],
          relay: this.#subscribe(name),
        });
        return new PowerStore(
          pairs.map(({volts, amps}) => ({volts: channel(volts), amps: channel(amps)})),
          {maxSize: CHART_POINTS},
        );
      },
    );
  }

  getSimpleStore(channel: CarriedName): SimpleStore {
    return this.#held(
      channel,
      SimpleStore,
      () => new SimpleStore(this.#subscribe(channel), {maxSize: CHART_POINTS}),
    );
  }

  getLatestStore(channel: CarriedName): LatestStore {
    return this.#held(`latest ${channel}`, LatestStore, () => {
      const store = new LatestStore();
      this.#subscribe(channel).register((records) => {
        store.update(records);
      });
      return store;
    });
  }

  getQuaternionStore(
    quaternionId: string,
    axes: Readonly<Record<Axis, CarriedName>>,
  ): QuaternionStore {
    return this.#held(
      quaternionId,
      QuaternionStore,
      () =>
        new QuaternionStore({
          x: this.#subscribe(axes.x),
          y: this.#subscribe(axes.y),
          z: this.#subscribe(axes.z),
          w: this.#subscribe(axes.w),
        }),
    );
  }
}
