/*
 * GOV UI — React components.
 *
 * Empty until the v0.1 component set lands.
 *
 * Two rules apply to everything exported from here:
 *
 * 1. Components render the markup declared in @gov-ui/manifest, and are
 *    verified against the golden fixtures by the conformance suite.
 *    React is one emitter among several; it is not the definition of
 *    correct markup.
 *
 * 2. Behavior is reimplemented here against the shared ARIA and keyboard
 *    contract — it does not wrap @gov-ui/core. Imperative DOM code
 *    behind React refs fights hydration and server rendering, which is
 *    the failure this separation avoids. See CLAUDE.md section 24.
 *
 * Zero runtime dependencies. React is a peer.
 */

export {};
