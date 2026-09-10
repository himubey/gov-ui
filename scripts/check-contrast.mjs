/*
 * Verifies the token palette against WCAG 2.2 contrast minimums.
 *
 * This runs in CI. The point is that the accessibility claims in the
 * documentation are measured from the tokens that actually ship, rather
 * than asserted once and left to rot.
 *
 * Reference: WCAG 2.2 SC 1.4.3 (text), 1.4.11 (non-text).
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const TOKENS = join(here, "..", "packages", "css", "src", "tokens.css");

/** Parse `--gov-*: #rrggbb;` declarations out of the token file. */
export function readTokens(file = TOKENS) {
  const css = readFileSync(file, "utf8");
  const tokens = {};
  const pattern = /(--gov-[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g;
  for (const match of css.matchAll(pattern)) {
    tokens[match[1]] = match[2];
  }
  return tokens;
}

function toRgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) {
    h = h.split("").map((c) => c + c).join("");
  }
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

/** Relative luminance, per the WCAG 2.x definition. */
function luminance(hex) {
  const channels = toRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrast(a, b) {
  const pair = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (pair[0] + 0.05) / (pair[1] + 0.05);
}

/*
 * Every pair the design system depends on.
 *
 * `min` is 4.5 for body text, and 3 for large text and for the edges of
 * interactive controls (SC 1.4.11 Non-text Contrast).
 */
export const PAIRS = [
  // Body text on every surface it can land on.
  ["--gov-text", "--gov-background", 4.5, "body text on page"],
  ["--gov-text", "--gov-surface", 4.5, "body text on raised surface"],
  ["--gov-text", "--gov-surface-sunken", 4.5, "body text on sunken surface"],
  ["--gov-text-muted", "--gov-background", 4.5, "muted text on page"],
  ["--gov-text-muted", "--gov-surface", 4.5, "muted text on raised surface"],

  // Primary button and links.
  ["--gov-primary-contrast", "--gov-primary", 4.5, "primary button label"],
  ["--gov-primary-contrast", "--gov-primary-hover", 4.5, "primary button label, hover"],
  ["--gov-primary", "--gov-background", 4.5, "link / primary text on page"],
  ["--gov-primary", "--gov-surface", 4.5, "link / primary text on surface"],

  // Destructive button.
  ["--gov-text-inverse", "--gov-danger", 4.5, "danger button label"],
  ["--gov-text-inverse", "--gov-danger-hover", 4.5, "danger button label, hover"],

  // Interactive control edges — non-text contrast.
  ["--gov-border-strong", "--gov-background", 3, "input border on page"],
  ["--gov-border-strong", "--gov-surface", 3, "input border on surface"],

  // Status badges: tinted surface with dark text.
  ["--gov-success-text", "--gov-success-surface", 4.5, "success badge"],
  ["--gov-warning-text", "--gov-warning-surface", 4.5, "warning badge"],
  ["--gov-danger-text", "--gov-danger-surface", 4.5, "danger badge"],
  ["--gov-info-text", "--gov-info-surface", 4.5, "info badge"],
  ["--gov-neutral-text", "--gov-neutral-surface", 4.5, "neutral badge"],

  // Status text must also read directly on the page and on a table row.
  ["--gov-success-text", "--gov-background", 4.5, "success text on page"],
  ["--gov-warning-text", "--gov-background", 4.5, "warning text on page"],
  ["--gov-danger-text", "--gov-background", 4.5, "danger text on page"],

  // The focus ring is two-tone. The dark band is what must carry contrast
  // against the page, against the yellow it surrounds, and against the
  // darkest thing it can be drawn on.
  ["--gov-focus-contrast", "--gov-background", 3, "focus ring outer edge on page"],
  ["--gov-focus-contrast", "--gov-focus", 3, "focus ring inner edge"],
  ["--gov-focus", "--gov-primary", 3, "focus ring on primary button"],
];

export function run(tokens = readTokens()) {
  const results = [];
  for (const entry of PAIRS) {
    const [fg, bg, min, label] = entry;
    if (!tokens[fg]) throw new Error("unknown token " + fg);
    if (!tokens[bg]) throw new Error("unknown token " + bg);
    const ratio = contrast(tokens[fg], tokens[bg]);
    results.push({ label, fg, bg, ratio, min, pass: ratio >= min });
  }
  return results;
}

// Report when invoked directly; the test file imports `run` instead.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const results = run();
  const width = Math.max.apply(null, results.map((r) => r.label.length));
  for (const r of results) {
    const mark = r.pass ? "PASS" : "FAIL";
    const ratio = r.ratio.toFixed(2).padStart(6);
    console.log(mark + "  " + r.label.padEnd(width) + "  " + ratio + ":1  (min " + r.min + ")");
  }
  const failed = results.filter((r) => !r.pass);
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " pairs pass");
  if (failed.length) process.exit(1);
}
