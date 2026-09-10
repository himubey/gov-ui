/*
 * GOV UI — component markup contract.
 *
 * Every component's markup is declared once, here, as data. Six things
 * derive from it:
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
  return true;
}

/*
 * HTML escaping.
 *
 * Text and attribute values are always escaped. GOV UI has no
 * dangerouslySetInnerHTML-shaped escape hatch, because the markup
 * contract is the security boundary for every server-rendered emitter
 * that copies it.
 */
const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/*
 * Resolve the class list for a set of props.
 *
 * Order is deterministic — base first, then each modifier in the order
 * the manifest declares its variants — so that golden fixtures are
 * stable and diffs stay readable.
 */
export function resolveClasses(manifest, props = {}) {
  const classes = [manifest.classes.base];
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
    classes.push(pattern.replace("{" + key + "}", String(value)));
  }

  if (props.className) classes.push(props.className);
  return classes;
}

/*
 * Reference renderer.
 *
 * This is the definition of correct markup. Adapters are not required to
 * share this code — a Razor tag helper obviously cannot — but they are
 * required to produce markup that normalizes to the same thing.
 */
export function renderToHtml(manifest, props = {}) {
  const tag = props.as || manifest.element;
  const classes = resolveClasses(manifest, props);

  const attributes = { class: classes.join(" ") };
  Object.assign(attributes, manifest.attributes || {});

  // Caller-supplied attributes win over manifest defaults, so a Button
  // can still be type="submit" inside a form.
  for (const [key, value] of Object.entries(props.attributes || {})) {
    if (value === undefined || value === null || value === false) {
      delete attributes[key];
    } else {
      attributes[key] = value === true ? "" : value;
    }
  }

  const rendered = Object.keys(attributes)
    .map((key) => {
      const value = attributes[key];
      return value === "" ? key : key + '="' + escapeHtml(value) + '"';
    })
    .join(" ");

  const open = "<" + tag + (rendered ? " " + rendered : "") + ">";

  if (manifest.voidElement) return open;

  const children = props.children === undefined ? "" : escapeHtml(props.children);
  return open + children + "</" + tag + ">";
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
    .replace(/<([a-zA-Z][\w-]*)((?:\s+[^\s=>]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/g,
      (_match, tag, attrs, selfClose) => {
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
          parsed.push(name + '="' + value + '"');
        }
        parsed.sort();
        const body = parsed.length ? " " + parsed.join(" ") : "";
        return "<" + tag.toLowerCase() + body + (selfClose ? "/" : "") + ">";
      })
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
