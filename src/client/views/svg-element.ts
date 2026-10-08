const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

// An attribute's value, a number written as String writes it; undefined leaves it unset.
export type SvgAttributes = Readonly<Record<string, string | number | undefined>>;

export function svgElement(
  tag: string,
  attributes: SvgAttributes,
  children: readonly Element[] = [],
): SVGElement {
  const element = document.createElementNS(SVG_NAMESPACE, tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value !== undefined) {
      element.setAttribute(name, String(value));
    }
  }
  element.append(...children);
  return element;
}
