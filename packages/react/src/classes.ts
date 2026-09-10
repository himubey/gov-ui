/*
 * Class-name helpers.
 *
 * Small enough to own. A styling library would be a runtime dependency
 * for something that is three lines of string handling (CLAUDE.md
 * section 26).
 */

export type ClassValue = string | false | null | undefined;

/** Join class names, dropping anything falsy. */
export function cx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}

/*
 * Derive a stable id from a field name.
 *
 * Must match `idFor` in @gov-ui/manifest exactly, or the React output
 * diverges from the golden markup and the conformance suite fails —
 * which is the intended safety net for this duplication.
 *
 * Deterministic rather than random (no useId) because server-rendered
 * markup has to match what the client produces, and the golden fixtures
 * have to be stable.
 */
export function idFor(base: string | undefined, suffix?: string): string {
  const safe = String(base || "field")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return suffix ? safe + "-" + suffix : safe;
}
