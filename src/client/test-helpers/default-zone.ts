import {Settings} from "luxon";
import {test as base} from "vitest";

function setDefaultZone(zone: string) {
  Settings.defaultZone = zone;
}

// setDefaultZone(zone) sets Luxon's default zone, which returns to the system zone after the
// test.
export const test = base.extend("setDefaultZone", ({}, {onCleanup}) => {
  onCleanup(() => {
    Settings.defaultZone = "system";
  });
  return setDefaultZone;
});
