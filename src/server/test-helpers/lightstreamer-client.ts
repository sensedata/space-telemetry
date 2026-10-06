import type {FieldValue} from "../feed-record.ts";

type FakeItemUpdate = {
  getItemName(): string;
  getValue(field: string): FieldValue;
};

type ClientListener = {onStatusChange?(status: string): void};

type SubscriptionListener = {
  onSubscription?(): void;
  onUnsubscription?(): void;
  onItemUpdate?(update: FakeItemUpdate): void;
};

// Stands in for lightstreamer-client-node 9.2 under its rules: subscribe() makes a
// Subscription active and throws if it already is; unsubscribe() of an inactive one does
// nothing. An active Subscription is subscribed only while a session is open, and a lost
// session unsubscribes it without deactivating it. The library delivers each event on
// setImmediate; the fake delivers them synchronously.
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types -- the returned module holds classes local to each fake, which no annotation outside the body can name
export function createFakeLightstreamer() {
  const clients: LightstreamerClient[] = [];
  const subscriptions: Subscription[] = [];
  // In activation order, as update() delivers.
  const active: Subscription[] = [];
  let sessionOpen = false;

  function confirm(subscription: Subscription) {
    subscription.subscribed = true;
    for (const listener of subscription.listeners) listener.onSubscription?.();
  }

  function drop(subscription: Subscription) {
    subscription.subscribed = false;
    for (const listener of subscription.listeners) listener.onUnsubscription?.();
  }

  // eslint-disable-next-line no-restricted-syntax -- lightstreamer.ts constructs a Subscription with new, and its listeners and subscribed flag change over the fake session's life
  class Subscription {
    readonly mode: string;
    readonly items: string[];
    readonly fields: string[];
    readonly listeners: SubscriptionListener[] = [];
    subscribed = false;

    constructor(mode: string, items: string | string[], fields: string[]) {
      this.mode = mode;
      this.items = [items].flat();
      this.fields = fields;
      subscriptions.push(this);
    }

    addListener(listener: SubscriptionListener) {
      this.listeners.push(listener);
    }

    isActive() {
      return active.includes(this);
    }

    isSubscribed() {
      return this.subscribed;
    }
  }

  // eslint-disable-next-line no-restricted-syntax -- lightstreamer.ts constructs a LightstreamerClient with new, and its listeners and slowing setting change over the fake connection's life
  class LightstreamerClient {
    readonly serverAddress: string;
    readonly adapterSet: string;
    readonly listeners: ClientListener[] = [];
    slowingEnabled: boolean | undefined;
    readonly connectionOptions = {
      setSlowingEnabled: (enabled: boolean) => {
        this.slowingEnabled = enabled;
      },
    };

    constructor(serverAddress: string, adapterSet: string) {
      this.serverAddress = serverAddress;
      this.adapterSet = adapterSet;
      clients.push(this);
    }

    addListener(listener: ClientListener) {
      this.listeners.push(listener);
    }

    connect() {
      openSession();
    }

    subscribe(subscription: Subscription) {
      if (subscription.isActive()) {
        throw new Error("Cannot subscribe to an active Subscription");
      }
      active.push(subscription);
      if (sessionOpen) {
        confirm(subscription);
      }
    }

    unsubscribe(subscription: Subscription) {
      if (!subscription.isActive()) {
        return;
      }
      active.splice(active.indexOf(subscription), 1);
      if (subscription.subscribed) {
        drop(subscription);
      }
    }
  }

  function openSession() {
    sessionOpen = true;
    const unconfirmed = active.filter((subscription) => !subscription.subscribed);
    for (const subscription of unconfirmed) confirm(subscription);
  }

  // A listener may unsubscribe another Subscription, so each is checked as it is reached.
  function loseSession() {
    sessionOpen = false;
    for (const subscription of subscriptions) {
      if (subscription.subscribed) {
        drop(subscription);
      }
    }
  }

  function changeStatus(status: string) {
    for (const client of clients)
      for (const listener of client.listeners) listener.onStatusChange?.(status);
  }

  function update(itemName: string, values: Readonly<Record<string, string>>) {
    const itemUpdate = {
      getItemName: () => itemName,
      // eslint-disable-next-line unicorn/no-null -- stands in for Lightstreamer's getValue, which returns null for an absent field
      getValue: (field: string) => values[field] ?? null,
    };

    // Iterating the live array lets a subscription made during this delivery receive the
    // update, as Lightstreamer sends a new subscription each item's current value.
    for (const subscription of active) {
      if (subscription.subscribed && subscription.items.includes(itemName)) {
        for (const listener of subscription.listeners)
          listener.onItemUpdate?.(itemUpdate);
      }
    }
  }

  return {
    module: {LightstreamerClient, Subscription},
    clients,
    subscriptions,
    update,
    changeStatus,
    loseSession,
    restoreSession: openSession,
  };
}

export type FakeLightstreamer = ReturnType<typeof createFakeLightstreamer>;
