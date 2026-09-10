# Contributing to GOV UI

Thanks for considering it. This document is the engineering guide: what the project values, how components are built, and what "done" means.

It is opinionated on purpose. A design system with no stated position produces inconsistent components, and inconsistency is the one defect users notice immediately.

---

## The short version

> **Simple code is not lower quality. For GOV UI, simplicity is a product requirement.**

When several approaches work, choose the one with fewer files, fewer dependencies, fewer abstractions, clearer HTML, a smaller public API, easier testing and better accessibility. Do not choose complexity because it looks architecturally impressive.

---

## Getting set up

```bash
npm install        # dev toolchain only: React + TypeScript
npm run build      # gov-ui.css, gov-ui.js, the React package, the docs site
npm test           # the full suite
npm run verify     # everything CI runs
```

The published packages carry **zero runtime dependencies**, and the foundation tests run on Node's built-in test runner. A zero-dependency library whose own tooling pulls in three hundred packages has moved the supply-chain problem rather than solved it.

### Repository layout

```
packages/
  manifest/   markup contract (JSON) — the source of truth
  css/        tokens + component styles   → gov-ui.css
  core/       framework-free behavior     → gov-ui.js (UMD)
  react/      typed React components
adapters/     markup emitters only — no styles, no behavior
fixtures/     golden HTML, shared by every conformance test
apps/docs/    static documentation site
examples/     plain-HTML and React reference pages
docs/         design principles and compliance evidence
```

`packages/css` and `packages/core` together **are the product**. Everything else consumes them.

---

## Principles

### It should feel like infrastructure

Users of government software rarely chose to be there; they are renewing a licence, filing a return or working a case queue. The interface earns its keep by being predictable, not memorable.

This rules out a lot: decorative gradients, glass effects, oversized rounded cards, animation that does not communicate state, and dashboards assembled from tiles that exist to fill space.

### Borders before shadows, typography before colour

Hierarchy comes from type, spacing, alignment and thin borders. Colour is reserved for meaning. Not every element should be coloured.

### Do not over-engineer

Prefer this:

```tsx
<Button variant="primary">Save</Button>
```

over a configuration system. Prefer:

```ts
const value = items.find((item) => item.id === id);
```

over a generic abstraction used once. Prefer plain CSS when plain CSS solves the problem. Do not build architecture for hypothetical future requirements.

### Small public APIs

Every component exposes the minimum useful API. The component owns its design; the application selects semantic variants.

```tsx
// Good
<Button variant="secondary">Cancel</Button>

// Not this
<Button color="#0b2a55" radius="3px" shadow="none" paddingX={16} fontWeight={600} />
```

### Human-readable code

Code should be understandable by someone who joins in six months. Descriptive names, straightforward control flow, small components, native browser behavior where possible.

Comment the **reason**, not the mechanics:

```ts
// Good — explains a decision that is not obvious from the code
// Keep the native button element so browser keyboard behavior and
// form participation stay predictable.

// Weak — narrates what the reader can already see
// This is a button.
```

---

## Architecture

### One markup contract, many emitters

```
                component manifest  ← the contract
                          │
      ┌───────────────────┼───────────────────┐
      │                   │                   │
 gov-ui.css          gov-ui.js          markup emitters
 (all styles)      (all behavior)   Razor · Django · Blade
                                     WordPress · React · HTML
```

Three rules keep this maintainable:

1. **Emitters produce markup only.** No behavior, no styles, no logic in any adapter. Adding a component means adding one template per adapter — mechanical work, not architectural work. Behavior or styling inside an adapter is a bug.
2. **The manifest is the source of truth.** Element, class names, ARIA attributes, slots and variants are declared once, machine-readably. Documentation, fixtures and every conformance test derive from it.
3. **Golden-HTML conformance runs in CI.** Every emitter renders the same fixtures and must produce equivalent DOM. If the Django template tag and the Razor tag helper disagree, the build fails.

**React is not privileged.** It does not wrap the vanilla core — imperative DOM code behind React refs fights hydration and server rendering. React reimplements the same behavior against the same contract, verified by the same tests.

### Zero runtime dependencies

The project uses no headless primitive library. All interaction behavior is written and owned here.

That decision costs real work — focus trapping, roving tabindex, typeahead and listbox semantics are genuinely difficult, and roughly six components carry nearly all of it. It is bounded and paid once. In return the behavior exists for **every** stack rather than only React, and no third party stands between a reported accessibility bug and its fix.

**Never add a runtime dependency to a published package.** CI asserts this.

### Progressive enhancement is mandatory

Server-rendered consumers cannot assume JavaScript, and low-bandwidth users often do not get it.

- Every component works without script and enhances when it loads.
- Native first: `<select>` before a custom listbox, `<details>` for disclosure, forms that submit on their own.
- `gov-ui.js` auto-initialises from `data-gov-module` attributes. One script tag, no wiring.
- Ship a plain stylesheet and a **UMD** bundle, never ESM-only. Many PHP, WordPress and Razor projects have no bundler, and requiring one excludes exactly the teams this project exists to serve.

---

## Design tokens

Tokens are the contract between the visual system and components. Components consume tokens and never repeat raw values.

### Spacing and type

Numeric steps, not t-shirt sizes:

```css
--gov-space-1:  4px;   /* … through --gov-space-9: 48px */
```

Do not let components invent arbitrary font sizes. Add a scale value only when a real repeated need appears.

### Shape

Small radii. GOV UI is border-driven, not card-driven.

| Element | Radius |
|---|---|
| Structural container | 0–2px |
| Input, button | 2–4px |
| Grouped surface | 4–6px |
| Pill | Only when genuinely status-like |

Never `border-radius: 9999px` unless the component is intentionally pill-shaped, and never default to 16px or 24px.

### Three token rules that are easy to get wrong

**The focus ring is never derived from `--gov-primary`.** A navy ring on a navy button is invisible. Yellow alone does not solve it either — `#ffdd00` is about 1.1:1 on white. The ring is two-tone: a yellow band inside a dark one, so whichever surface it lands on, one edge carries the contrast.

**There are two border tokens.** `--gov-border` is decoration — table rules, dividers. `--gov-border-strong` is the edge of an interactive control, which WCAG 2.2 requires to reach 3:1 (SC 1.4.11). Collapsing them into one light grey is among the most common ways a design system quietly fails that criterion. A test enforces the split.

**Density is a token-level mode, never a prop.** One attribute on a container changes the whole page:

```html
<div data-gov-density="compact"> … </div>
```

No component takes a `density` prop.

---

## Accessibility

Accessibility is designed in, not audited afterwards. The target is **WCAG 2.2 Level AA**, and the project publishes a VPAT and a GIGW 3.0 mapping as evidence.

- Prefer semantic HTML. Use ARIA only when the platform offers nothing.
- Every form control needs an accessible name. A placeholder is not a label.
- Keyboard must reach and operate everything. Focus must stay visible.
- Do not rely on colour alone, or on hover for essential information.
- Respect `prefers-reduced-motion` and support `forced-colors: active`.
- Errors must identify the field and explain how to fix it.

Automated tooling catches roughly a third of real defects, so a manual keyboard pass is part of every component's definition of done, and a screen-reader pass for interactive ones.

### Internationalisation

Latin-centric defaults are bugs:

- **Use logical CSS properties everywhere** — `padding-inline`, `border-inline-start`. Never `left` or `right`. A component that breaks under `dir="rtl"` is not done.
- **Keep tight line-height at or above 1.4.** Devanagari matras sit above and below the baseline and clip at the ~1.2 heading line-height most systems use. Bengali, Tamil and Gurmukhi behave the same way.
- No string concatenation to build sentences; word order differs between languages.
- Test against long strings. Hindi and German run substantially longer than English, and fixed-width controls break first.
- Respect locale conventions: DD/MM/YYYY, and lakh/crore grouping via `Intl.NumberFormat` with `en-IN`.

---

## Adding a component

Before writing anything, work through this:

```
Is it genuinely reusable?
    ↓
Does an existing component already solve it?
    ↓
Is it a primitive or a pattern?
    ↓
Can its API stay small?
    ↓
Can it be accessible, documented and tested?
```

If not, stop and reconsider.

### The files

A component is spread across layers rather than gathered in one directory, because the layers have different consumers:

```
packages/manifest/components/button.json   markup + a11y contract, examples
packages/css/src/components/button.css     styles — shared by EVERY emitter
packages/react/src/button/Button.tsx       the React emitter
fixtures/button.html                       golden markup, generated
```

**Styles are not co-located with the React component.** They belong to `packages/css`, which every emitter shares. Putting a component's CSS inside the React package would make React the privileged consumer and break the framework-free layer.

### The workflow

1. Write the **manifest** first — element, classes, variants, ARIA contract, examples.
2. Add the **CSS**, using tokens only.
3. Implement the **React** component against the same contract.
4. Run `npm run conformance:update` and review the golden markup diff. That diff *is* the public API change.
5. Add tests. Update documentation.
6. Review your own diff for unnecessary complexity, and delete what was not needed.

The manifest's `examples` are the conformance cases. Every declared variant value must appear in at least one example, or it ships with no golden markup and nothing verifies it.

### CSS rules

Stable `gov-` prefixed classes, shallow selectors, variables for shared values:

```css
/* Good */
.gov-button--primary { background: var(--gov-primary); }

/* Bad */
.page .content .toolbar .button-container button span { … }
```

Avoid specificity battles. Do not require CSS-in-JS. Keep motion minimal.

---

## Testing

```
unit / utility
      ↓
component + accessibility
      ↓
browser / integration
      ↓
reference application
```

Test user-facing behavior, not implementation details: default render, variants, disabled state, keyboard behavior, focus behavior, validation and error states, accessible name and role.

### Individual gates

```bash
npm run check:contrast     # every token pair meets its WCAG minimum
npm run check:conformance  # every emitter matches the golden markup
npm run check:deps         # no package carries a runtime dependency
npm run check:budget       # payload within the gzipped limits
npm run check:examples     # the React example typechecks against the public API
```

---

## Before adding a dependency

Ask, in order:

1. Can the browser solve this?
2. Can React solve this?
3. Can a small local function solve this?
4. Is it solving a real, repeated problem?
5. Will it still be maintained in several years?
6. Does it complicate SSR, or add an API developers must learn?

If the answer is unclear, do not add it.

---

## Definition of done

A component is ready for public use when:

- Its purpose is clear and its API is small
- Visual behavior uses tokens
- Keyboard and focus behavior are correct
- Important states are implemented
- It renders correctly with JavaScript disabled
- It survives `forced-colors: active`, 200% zoom and `dir="rtl"`
- Component tests exist, and a manual keyboard walkthrough is recorded in its docs
- Every emitter renders it to equivalent markup
- It adds **no** runtime dependency
- It works in the reference application

A component is **not** done because it looks correct in one screenshot.

---

## Commits and pull requests

Small, focused commits. Do not mix unrelated refactors into a feature commit.

```
feat(button): add primary and secondary variants
fix(input): preserve visible focus state
docs(table): document sorting behavior
test(dialog): cover keyboard close behavior
```

Not `update stuff`, `changes`, `final`, `fix`.

A useful pull request explains what changed, why it was needed, what design decision was made, how it was tested, and whether it affects the public API. Include a screenshot for visual changes.

If a golden fixture changed, say so — that is a change to the public markup contract and reviewers should look at it directly.

---

## Explicitly not wanted

```
❌ runtime dependencies in a published package
❌ ESM-only distribution, or a required build step
❌ behavior or styles inside an adapter
❌ a component that only works in React
❌ a focus ring derived from the primary colour
❌ line-height below 1.4
❌ physical CSS properties (left/right) instead of logical ones
❌ state emblems, seals, crowns or other official insignia
❌ giant component APIs and styling knobs
❌ unnecessary providers, context or premature abstraction
❌ CSS-in-JS as a requirement
❌ excessive animation, glassmorphism, decorative gradients
❌ unsafe HTML injection
❌ client-side security claims
```

---

## Security

GOV UI does not make an application secure. Use the language **"security-minded UI defaults"**, never "GOV UI makes your application secure."

The library avoids unsafe HTML injection, prefers React's normal escaping, keeps dependencies at zero, and provides confirmation patterns for destructive actions. Authentication, authorisation, session security, CSRF, server-side validation, API and database security, file handling and secrets management all remain the application's responsibility.

---

## When to stop

If the task is complete, stop. Do not refactor unrelated files, rename unrelated components, redesign other pages, add speculative utilities, or add components nobody requested.

A small correct change is better than a large "improvement".

---

## Licence

By contributing you agree that your contributions are licensed under the [MIT Licence](LICENSE).
