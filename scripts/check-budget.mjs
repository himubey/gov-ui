/*
 * Enforces the payload budget.
 *
 * The target device is a low-end Android phone on a slow connection, not
 * a laptop. A budget that is only aspirational gets exceeded quietly,
 * one component at a time, so it is a build gate here.
 *
 * Gzip is what browsers actually receive, so that is what is measured.
 */

import { readFileSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

/*
 * Budgets in KB gzipped, from the plan's verification criteria.
 *
 * Raise one only with a reason recorded in the commit message. The
 * number existing is more important than the number being exactly right.
 */
export const BUDGETS = [
  { file: "packages/css/dist/gov-ui.css", limit: 25, label: "stylesheet" },
  { file: "packages/core/dist/gov-ui.js", limit: 15, label: "behavior" },
];

export function measure(budgets = BUDGETS) {
  return budgets.map((budget) => {
    const path = join(root, budget.file);
    if (!existsSync(path)) {
      return { ...budget, missing: true, kb: 0, pass: false };
    }
    const kb = gzipSync(readFileSync(path)).length / 1024;
    return { ...budget, missing: false, kb, pass: kb <= budget.limit };
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const results = measure();
  let failed = false;

  for (const r of results) {
    if (r.missing) {
      console.error("FAIL " + r.file + " not built — run npm run build first");
      failed = true;
      continue;
    }
    const pct = Math.round((r.kb / r.limit) * 100);
    const mark = r.pass ? "PASS" : "FAIL";
    console.log(
      mark + "  " + r.label.padEnd(10) + " " + r.kb.toFixed(1).padStart(6) +
        " KB gzipped of " + r.limit + " KB  (" + pct + "% of budget)",
    );
    if (!r.pass) failed = true;
  }

  process.exit(failed ? 1 : 0);
}
