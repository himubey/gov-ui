/*
 * Builds dist/gov-ui.css by concatenating the source files in order.
 *
 * Deliberately not a bundler. The output must be a plain stylesheet that
 * a WordPress theme or a Razor page can link directly, and the build has
 * no dependencies so it runs anywhere Node runs.
 *
 * Order matters: tokens define the variables that base and the
 * components consume.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "src");
const dist = join(here, "dist");

const HEADER = [
  "/*!",
  " * GOV UI",
  " * Lightweight UI for government software.",
  " *",
  " * Framework-independent stylesheet. Link it directly; no build step",
  " * is required. Theme it by overriding the --gov-* custom properties.",
  " *",
  " * MIT licensed. Not affiliated with or endorsed by any government.",
  " */",
  "",
].join("\n");

// tokens first, then base, then components in alphabetical order.
const componentsDir = join(src, "components");
const components = existsSync(componentsDir)
  ? readdirSync(componentsDir).filter((f) => f.endsWith(".css")).sort()
  : [];

const parts = [HEADER, readFileSync(join(src, "tokens.css"), "utf8"), readFileSync(join(src, "base.css"), "utf8")];

for (const file of components) {
  parts.push(readFileSync(join(componentsDir, file), "utf8"));
}

const css = parts.join("\n");

mkdirSync(dist, { recursive: true });
writeFileSync(join(dist, "gov-ui.css"), css);

const bytes = Buffer.byteLength(css);
console.log(
  "gov-ui.css  " + components.length + " component file(s)  " + (bytes / 1024).toFixed(1) + " KB raw",
);
