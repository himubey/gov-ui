/*
 * GOV UI — component markup contract.
 *
 * Every component's markup is declared once, here. Six things derive
 * from it:
 *
 *   - the plain-HTML reference implementation
 *   - the golden fixtures
 *   - each adapter's conformance test
 *   - the documentation's "HTML equivalent" panel
 *   - the class-name reference
 *   - the accessibility contract
 *
 * The reason for the indirection is drift. Community ports of other
 * government design systems fall behind their originals because nothing
 * mechanically checks that a Django tag and a Razor tag helper still
 * agree. Here, something does: every emitter is rendered against these
 * manifests and compared.
 *
 * Zero dependencies.
 */

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { renderers } from "./renderers/index.mjs";
import { el, raw } from "./render.mjs";

export { escapeHtml, el, raw } from "./render.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const COMPONENTS_DIR = join(here, "components");

/** Load every component manifest, keyed by name. */
export function loadManifests(dir = COMPONENTS_DIR) {
  const manifests = {};
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
    const manifest = JSON.parse(readFileSync(join(dir, file), "utf8"));
    validateManifest(manifest, file);
    manifests[manifest.name] = manifest;
  }
  return manifests;
}

const REQUIRED_KEYS = ["name", "element", "classes"];

export function validateManifest(manifest, source = manifest.name) {
  for (const key of REQUIRED_KEYS) {
    if (!(key in manifest)) {
      throw new Error("manifest " + source + " is missing required key: " + key);
    }
  }
  if (!manifest.classes.base) {
    throw new Error("manifest " + source + " must declare classes.base");
  }
  if (!manifest.classes.base.startsWith("gov-")) {
    throw new Error("manifest " + source + " base class must use the gov- prefix");
  }
  if (!manifest.examples || Object.keys(manifest.examples).length === 0) {
    throw new Error(
      "manifest " + source + " must declare at least one example — examples are the conformance cases",
    );
  }
  return true;
}

/*
 * Resolve the class list for a set of props.
 *
 * Order is deterministic — base first, then each modifier in the order
 * the manifest declares its variants — so golden fixtures stay stable
 * and diffs stay readable.
 */
export function resolveClasses(manifest, props = {}) {
  const list = [manifest.classes.base];
  const variants = manifest.variants || {};
  const defaults = manifest.defaults || {};

  for (const key of Object.keys(variants)) {
    const value = props[key] === undefined ? defaults[key] : props[key];
    if (value === undefined || value === null || value === false) continue;

    const allowed = variants[key];
    if (Array.isArray(allowed) && !allowed.includes(value)) {
      throw new Error(
        "component " + manifest.name + ": '" + value + "' is not a valid " + key +
          " (expected one of: " + allowed.join(", ") + ")",
      );
    }

    const pattern = manifest.classes[key] || manifest.classes.base + "--{" + key + "}";
    list.push(pattern.replace("{" + key + "}", String(value)));
  }

  if (props.className) list.push(props.className);
  return list;
}

/*
 * Create a renderer bound to a set of manifests.
 *
 * Components compose by passing `{ component, props }` descriptors as
 * children, so the whole tree stays escaped and declarative — there is
 * no path for raw markup to be injected.
 */
export function createRenderer(manifests = loadManifests()) {
  function render(name, props = {}) {
    const manifest = manifests[name];
    if (!manifest) throw new Error("unknown component: " + name);

    const resolved = { ...props };
    if (resolved.children !== undefined) {
      resolved.children = resolveChildren(resolved.children);
    }

    const renderer = renderers[name];
    const html = renderer
      ? renderer(manifest, resolved, render)
      : renderLeaf(manifest, resolved);

    return String(html);
  }

  /* Turn `{component, props}` descriptors into rendered markup. */
  function resolveChildren(children) {
    if (Array.isArray(children)) return children.map(resolveChildren);
    if (children && typeof children === "object" && children.component) {
      return raw(render(children.component, children.props || {}));
    }
    return children;
  }

  return render;
}

/*
 * Fallback for single-element components that need no bespoke renderer.
 */
function renderLeaf(manifest, props) {
  const tag = props.as || manifest.element;
  const attributes = { class: resolveClasses(manifest, props).join(" ") };
  Object.assign(attributes, manifest.attributes || {});

  // Caller-supplied attributes win over manifest defaults, so a Button
  // can still be type="submit" inside a form.
  for (const [key, value] of Object.entries(props.attributes || {})) {
    if (value === undefined || value === null || value === false) {
      delete attributes[key];
    } else {
      attributes[key] = value;
    }
  }

  if (manifest.voidElement) return el(tag, attributes);
  return el(tag, attributes, props.children);
}

/** Convenience for a one-off render without building a renderer. */
export function renderToHtml(manifest, props = {}) {
  const render = createRenderer({ [manifest.name]: manifest });
  return render(manifest.name, props);
}

/*
 * Normalize HTML for comparison.
 *
 * The conformance suite checks DOM equivalence, not byte equality:
 * adapters legitimately differ in attribute order, class order and
 * whitespace. Anything beyond that is a real divergence.
 *
 * This is a light tokenizer rather than a full HTML parser, which is
 * sufficient for the flat, attribute-only markup these components emit.
 * If a component ever needs markup this cannot handle, that is a signal
 * the component is too complicated, not that the harness needs a parser.
 */
export function normalizeHtml(html) {
  return String(html)
    .replace(
      /<([a-zA-Z][\w-]*)((?:\s+[^\s=>]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/g,
      (_match, tag, attrs) => {
        const parsed = [];
        const pattern = /([^\s=]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s]+)))?/g;
        let m;
        while ((m = pattern.exec(attrs)) !== null) {
          const name = m[1].toLowerCase();
          let value = m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4];
          if (value === undefined) {
            parsed.push(name);
            continue;
          }
          // Class order carries no meaning in the DOM.
          if (name === "class") {
            value = value.trim().split(/\s+/).filter(Boolean).sort().join(" ");
          }
          // In HTML a bare boolean attribute and one with an empty
          // value both resolve to the empty string, so `disabled` and
          // `disabled=""` describe the same DOM. React emits the latter,
          // the reference renderer the former.
          parsed.push(value === "" ? name : name + '="' + value + '"');
        }
        parsed.sort();
        const body = parsed.length ? " " + parsed.join(" ") : "";
        // The trailing slash in a start tag is ignored by HTML parsers,
        // so <input> and <input /> describe the same DOM. React emits
        // the slash and the reference renderer does not; without this,
        // every void element would read as a false divergence.
        return "<" + tag.toLowerCase() + body + ">";
      },
    )
    // Closing tags too: HTML tag names are case-insensitive, so
    // </BUTTON> and </button> describe the same DOM.
    .replace(/<\/([a-zA-Z][\w-]*)\s*>/g, (_m, tag) => "</" + tag.toLowerCase() + ">")
    .replace(/>\s+</g, "><")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when two markup strings describe the same DOM. */
export function isEquivalent(a, b) {
  return normalizeHtml(a) === normalizeHtml(b);
}
