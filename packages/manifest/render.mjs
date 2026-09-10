/*
 * Rendering helpers shared by the reference renderers.
 *
 * A deliberate choice not to invent a template language. The manifests
 * stay declarative about the things that actually drift between
 * emitters — class names, variants, ARIA — and the markup shape is
 * expressed as small, readable JavaScript. A DSL would be one more
 * thing to learn and one more thing to debug, for no extra guarantee:
 * conformance is enforced by comparing output, not by sharing code.
 */

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

const VOID_ELEMENTS = new Set(["input", "img", "br", "hr", "meta", "link"]);

/*
 * Build an element.
 *
 * Attribute values that are null, undefined or false are dropped, so a
 * renderer can write `{ "aria-current": isCurrent && "page" }` without
 * branching. `true` renders the attribute bare.
 *
 * `children` may be a string (escaped as text), a pre-built element from
 * this function, or an array of either. There is no way to pass raw
 * markup through: every string that reaches the output is escaped, which
 * is what keeps the markup contract safe for the server-rendered
 * emitters that copy it.
 */
export function el(tag, attributes, children) {
  const rendered = [];

  for (const [name, value] of Object.entries(attributes || {})) {
    if (value === null || value === undefined || value === false) continue;
    rendered.push(value === true ? name : name + '="' + escapeHtml(value) + '"');
  }

  const open = "<" + tag + (rendered.length ? " " + rendered.join(" ") : "") + ">";
  if (VOID_ELEMENTS.has(tag)) return new Markup(open);

  return new Markup(open + renderChildren(children) + "</" + tag + ">");
}

/* Marks a string as already-rendered markup so it is not escaped again. */
export class Markup {
  constructor(html) {
    this.html = html;
  }
  toString() {
    return this.html;
  }
}

/*
 * Wrap already-rendered markup so it passes through unescaped.
 *
 * The only supported way to compose pre-rendered output. Renderers never
 * hand raw strings to each other, so there is exactly one place where
 * escaping can be bypassed and it is this one.
 */
export function raw(html) {
  return new Markup(String(html));
}

export function renderChildren(children) {
  if (children === null || children === undefined || children === false) return "";
  if (Array.isArray(children)) return children.map(renderChildren).join("");
  if (children instanceof Markup) return children.html;
  return escapeHtml(children);
}

/* Join class names, dropping anything falsy. */
export function classes(...values) {
  return values.filter(Boolean).join(" ");
}

/*
 * A stable id derived from a name, for wiring label/hint/error together.
 *
 * Deterministic rather than random: golden fixtures have to be stable,
 * and server-rendered markup has to match what the client would produce.
 */
export function idFor(base, suffix) {
  const safe = String(base || "field")
    // employeeName -> employee-name, rather than employeename.
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return suffix ? safe + "-" + suffix : safe;
}
