export function span(
  text: string,
  attributes: Readonly<Record<string, string>> = {},
): HTMLSpanElement {
  const element = document.createElement("span");
  element.textContent = text;
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  return element;
}
