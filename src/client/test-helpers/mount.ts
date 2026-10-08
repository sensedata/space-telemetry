import {test as base} from "vitest";

import {mount as mountInto, type View} from "../views/mount.ts";

// mount(view) shows a view in a fresh container under document.body, unmounted after the
// test. Tests in a file share jsdom's one document, so each view gets its own container.
export const test = base.extend("mount", ({}, {onCleanup}) => {
  const unmounts: (() => void)[] = [];
  onCleanup(() => {
    for (const unmount of unmounts) unmount();
  });
  return (view: View): Element => {
    const container = document.createElement("div");
    document.body.append(container);
    unmounts.push(mountInto(view, container));
    return container;
  };
});
