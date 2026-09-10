/*
 * Enforces the zero-runtime-dependency rule.
 *
 * CLAUDE.md section 24 makes this the load-bearing decision of the whole
 * project: it is what lets the behavior exist for every stack rather
 * than only for React, and what keeps the supply chain reviewable by a
 * government security team.
 *
 * A rule that is only written down erodes. This asserts it against the
 * package manifests that actually ship.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const PACKAGES = join(here, "..", "packages");

/*
 * peerDependencies are permitted: they are supplied by the consumer, not
 * installed by us. React is the only legitimate case.
 */
const ALLOWED_PEERS = new Set(["react", "react-dom"]);

export function check(packagesDir = PACKAGES) {
  const problems = [];

  for (const name of readdirSync(packagesDir).sort()) {
    const manifestPath = join(packagesDir, name, "package.json");
    if (!existsSync(manifestPath)) continue;

    const pkg = JSON.parse(readFileSync(manifestPath, "utf8"));

    const runtime = Object.keys(pkg.dependencies || {});
    if (runtime.length > 0) {
      problems.push(
        pkg.name + " declares runtime dependencies: " + runtime.join(", ") +
          " — see CLAUDE.md section 24",
      );
    }

    for (const peer of Object.keys(pkg.peerDependencies || {})) {
      if (!ALLOWED_PEERS.has(peer)) {
        problems.push(pkg.name + " declares an unexpected peer dependency: " + peer);
      }
    }

    // devDependencies are not forbidden, but the foundation currently
    // needs none, and that is worth noticing if it changes.
    const dev = Object.keys(pkg.devDependencies || {});
    if (dev.length > 0) {
      console.log("note: " + pkg.name + " has devDependencies: " + dev.join(", "));
    }
  }

  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = check();
  if (problems.length === 0) {
    console.log("dependencies: every package is free of runtime dependencies");
    process.exit(0);
  }
  for (const problem of problems) console.error("FAIL " + problem);
  process.exit(1);
}
