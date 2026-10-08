import * as channels from "../contract/channels.ts";
import type {FieldValue} from "./feed-record.ts";
import {feedTimeToUnix} from "./feed-time-to-unix.ts";
import {newSessionId} from "./session-id.ts";
import type {Source} from "./source.ts";

const SCHEMA = ["TimeStamp", "Value", "Status.Class", "CalibratedData"];

type Subscription = {
  addListener(listener: {
    onSubscription?(): void;
    onUnsubscription?(): void;
    onItemUpdate?(update: {
      getItemName(): string;
      getValue(field: string): FieldValue;
    }): void;
  }): void;
  isSubscribed(): boolean;
};

// What the adapter uses of lightstreamer-client-node.
export type Lightstreamer = {
  readonly LightstreamerClient: new (
    serverAddress: string,
    adapterSet: string,
  ) => {
    readonly connectionOptions: {setSlowingEnabled(enabled: boolean): void};
    addListener(listener: {onStatusChange?(status: string): void}): void;
    subscribe(subscription: Subscription): void;
    unsubscribe(subscription: Subscription): void;
    connect(): void;
  };
  readonly Subscription: new (
    mode: string,
    items: string | string[],
    fields: string[],
  ) => Subscription;
};

// Number reads blank text as 0, so blank text is mapped to NaN as an absent field is.
function fieldNumber(text: FieldValue): number {
  return text === null || text.trim() === "" ? NaN : Number(text);
}

// Lightstreamer catches a listener's throw and logs it only through a logger provider,
// which nothing here sets, so each listener reports its own.
function reporting<Args extends unknown[]>(
  listener: string,
  handle: (...args: Args) => void,
): (...args: Args) => void {
  return (...args) => {
    try {
      handle(...args);
    } catch (error) {
      console.error("lightstreamer %s failed:", listener, error);
    }
  };
}

/**
 * Connects to the ISS feed on Lightstreamer and emits each update of a carried channel
 * into `source` as a record. It subscribes telemetry while TIME_000001's status class is
 * 24, and unsubscribes it 10 seconds after that status leaves 24. It has `source` expect
 * TIME_000001 within 15 seconds of a change of connection status and within 10 of a
 * telemetry subscription.
 */
export function start(
  {LightstreamerClient, Subscription}: Lightstreamer,
  source: Pick<Source, "emit" | "expectTimeWithin">,
): void {
  const lsClient = new LightstreamerClient("https://push.lightstreamer.com", "ISSLIVE");

  lsClient.connectionOptions.setSlowingEnabled(false);

  // STATUS is the server's own channel, not an ISSLIVE item.
  const telemetrySub = new Subscription(
    "MERGE",
    channels.names.filter((name) => name !== "STATUS"),
    SCHEMA,
  );
  const timeSub = new Subscription("MERGE", "TIME_000001", ["Status.Class"]);

  // telemetrySessionId is set on the telemetry subscription, which comes before any of its
  // updates.
  const state: {telemetrySessionId: number; unsubTimeout?: NodeJS.Timeout | undefined} = {
    telemetrySessionId: 0,
  };

  lsClient.addListener({
    onStatusChange: reporting("onStatusChange", (status) => {
      console.log("lightstreamer status:", status);
      source.expectTimeWithin(15_000);
    }),
  });

  lsClient.subscribe(timeSub);
  lsClient.connect();

  timeSub.addListener({
    onUnsubscription: reporting("TIME_000001 onUnsubscription", () => {
      lsClient.unsubscribe(telemetrySub);
    }),

    onItemUpdate: reporting("TIME_000001 onItemUpdate", (update) => {
      const status = update.getValue("Status.Class");
      const subscribed = telemetrySub.isSubscribed();

      if (status === "24" && state.unsubTimeout) {
        clearTimeout(state.unsubTimeout);
        state.unsubTimeout = undefined;
      }

      if (status === "24" && !subscribed) {
        lsClient.subscribe(telemetrySub);
      } else if (status !== "24" && subscribed) {
        // Lets Lightstreamer deliver outstanding updates before the unsubscribe.
        clearTimeout(state.unsubTimeout);
        state.unsubTimeout = setTimeout(() => {
          lsClient.unsubscribe(telemetrySub);
        }, 10_000);
      }
    }),
  });

  telemetrySub.addListener({
    onSubscription: reporting("telemetry onSubscription", () => {
      state.telemetrySessionId = newSessionId();
      source.expectTimeWithin(10_000);
    }),

    onItemUpdate: reporting("telemetry onItemUpdate", (update) => {
      const itemName = update.getItemName();
      let value = fieldNumber(update.getValue("Value"));
      let timestamp = fieldNumber(update.getValue("TimeStamp"));
      const statusClass = fieldNumber(update.getValue("Status.Class"));

      if (timestamp) {
        timestamp = feedTimeToUnix(timestamp, new Date());
      }

      // TIME_000001's value is its own timestamp.
      if (itemName === "TIME_000001") {
        value = timestamp;
      }

      source.emit("data", {
        k: itemName,
        v: value,
        cv: update.getValue("CalibratedData"),
        t: timestamp,
        s: statusClass,
        sid: state.telemetrySessionId,
      });
    }),
  });
}
