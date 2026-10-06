import {type ComponentChild, render} from "preact";
import {test as base} from "vitest";

// mount(view) renders a view into a fresh container under document.body, unmounted after the
// test. Tests in a file share jsdom's one document, so each view gets its own container.
export const test = base.extend("mount", ({}, {onCleanup}) => {
  const containers: Element[] = [];
  onCleanup(() => {
    for (const container of containers) render(undefined, container);
  });
  return (view: ComponentChild): Element => {
    const container = document.createElement("div");
    document.body.append(container);
    containers.push(container);
    render(view, container);
    return container;
  };
});
