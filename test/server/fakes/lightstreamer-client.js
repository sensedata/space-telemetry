'use strict';

module.exports = function createFakeLightstreamer() {
  const subscriptions = [];

  function notify(subscription, event, argument) {
    subscription.listeners.forEach(listener => {
      if (listener[event]) {
        listener[event](argument);
      }
    });
  }

  class Subscription {
    constructor(mode, items) {
      this.items = [].concat(items);
      this.listeners = [];
    }

    addListener(listener) {
      this.listeners.push(listener);
    }

    isSubscribed() {
      return subscriptions.includes(this);
    }
  }

  class LightstreamerClient {
    constructor() {
      this.connectionOptions = {setSlowingEnabled() {}};
    }

    addListener() {}

    connect() {}

    subscribe(subscription) {
      subscriptions.push(subscription);
      notify(subscription, 'onSubscription');
    }

    unsubscribe(subscription) {
      subscriptions.splice(subscriptions.indexOf(subscription), 1);
      notify(subscription, 'onUnsubscription');
    }
  }

  function update(itemName, values) {
    const itemUpdate = {
      getItemName: () => itemName,
      getValue: field => values[field]
    };

    // Indexing the live array lets a subscription made during this delivery receive the
    // update, as Lightstreamer sends a new subscription each item's current value.
    for (let i = 0; i < subscriptions.length; i++) {
      if (subscriptions[i].items.includes(itemName)) {
        notify(subscriptions[i], 'onItemUpdate', itemUpdate);
      }
    }
  }

  return {module: {LightstreamerClient, Subscription}, update};
};
