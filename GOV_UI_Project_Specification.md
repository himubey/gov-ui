# GOV UI — Project Specification

> **Lightweight UI for government software.**
>
> A practical blueprint for a simple, accessible, framework-friendly design system for government and public-sector applications.
>
> **Source:** `GOV_UI_Project_Specification.pdf`

---

## GOV UI

### Design, Architecture & Engineering Specification

**Lightweight UI for government software.**

A practical blueprint for a simple, accessible, framework-friendly design system for government and public-sector applications. The visual language is intentionally restrained: clear typography, borders, semantic color, predictable interaction, and minimal decoration.

| Item | Direction |
|---|---|
| Document | GOV UI project specification |
| Primary ecosystem | React / Next.js |
| Framework-free layer | CSS + design tokens + semantic HTML |
| Default theme | Government blue + neutral foundation |
| License direction | MIT License |
| Engineering principle | Human-written, maintainable, no over-engineering |

> This document is the working source of truth for the initial repository. Update it as decisions become final.

---

## Contents

1. Vision and scope
2. Design principles
3. Visual language
4. Tokens and theming
5. Accessibility
6. Component strategy
7. Framework strategy
8. Repository architecture
9. React architecture
10. CSS architecture
11. API and naming conventions
12. Forms, tables, navigation and patterns
13. Security-minded engineering
14. Maintainable code rules
15. Testing
16. Documentation
17. Releases and versioning
18. Roadmap
19. Definition of done
20. Reference implementation
21. Internationalization
22. Decisions and non-goals

> **Rule of thumb:** when a simple implementation meets the requirement, choose the simple implementation.

---

## 1. Vision and scope

GOV UI is a design system and component library for government and public-sector software. It is not intended to be a trendy visual framework. Its purpose is to make ordinary software easier to build consistently and easier for users to understand.

### Positioning

GOV UI targets **internal public-sector administration software**, admin-first: records systems, caseworker tools, approvals and workflows, employee management, and education or licensing administration. Citizen-facing service patterns follow in a later phase.

This is a deliberate choice, and it is what separates GOV UI from the systems that already exist.

### Why not GOV.UK Design System or USWDS

The GOV.UK Design System, USWDS, the GC Design System and NL Design System are mature, well-audited and free. Where they fit, use them.

They are built for **citizen-facing transactional services**: one question per page, large type, low density, minimal chrome. That is the right design for a person applying for a licence once a year, and the wrong design for a caseworker processing four hundred records a day. Governments that adopt those systems for their public sites still hand-roll their internal admin interfaces, because dense tables, bulk actions, filter toolbars, audit trails and record detail views are simply out of scope for them.

GOV UI fills that gap. It is **complementary to those systems, not a competitor**. Two further differences follow from it:

- **Universal by construction.** GOV.UK Frontend is Nunjucks; USWDS is Sass-coupled. GOV UI ships a framework-free CSS and JavaScript core that .NET, Django, PHP, WordPress, plain HTML and React all consume equally. See section 7.
- **Runtime theming.** USWDS themes at Sass compile time and GOV.UK is brand-locked. GOV UI themes through CSS custom properties at runtime, so one build serves many departments.

### Goals

- Provide a restrained visual language for public-sector applications.
- Make forms, tables, records, search, approvals, dashboards and administration workflows easy to build.
- Work in any server-rendered or client-rendered stack, with React as one first-class consumer among several.
- Keep runtime and dependency weight low. The published packages carry **zero runtime dependencies**.
- Make accessibility a component-level requirement, with a stated conformance target and published evidence.
- Allow organizations to change the primary theme without rewriting components.
- Keep APIs small enough to understand from component names and a few props.

### Scope boundary

GOV UI provides presentation, interaction patterns, accessibility behavior and developer-facing primitives. It does not provide authentication, authorization, database security, identity management, hosting or application-level security.

---

## 2. Design principles
Principle
Rule
Simple before clever
Prefer direct, obvious code over abstractions that save a few lines.
Familiar over fashionable
Optimize for trust and comprehension, not visual novelty.
Square and restrained
Use small radii, thin borders and controlled shadows.
Hierarchy over decoration
Typography, spacing, alignment and semantic color create hierarchy.
Content first
Records, names, dates, statuses and forms matter more than decoration.
Accessible by construction
Keyboard, focus, semantics and announcements are part of implementation.
Framework-friendly
Tokens and CSS must not require React.
Themeable
Applications change tokens instead of rewriting components.
Small dependencies
Every dependency needs a durable reason to exist.
No magic
Avoid hidden state and surprising defaults.
Avoid
- Excessive gradients, glass effects and decorative blobs.
- Large rounded cards used everywhere.
- Animations that do not communicate state.
- Dashboard cards that only fill empty space.
- Excessive iconography.
- Huge component APIs and styling knobs.
- A dependency for every tiny interaction.
- Calling the UI library itself 'secure'.

---

## 3. Visual language
The supplied employee-management and related interface references establish the initial direction:
dark/navy navigation, white content areas, clear headings, compact controls, thin borders, restrained
status colors, table-oriented density and purposeful whitespace.
Layout
- Use a consistent content container.
- Use a clear page header with title, optional description and primary action.
- Use toolbars for search, filters and actions.
- Use cards only for real information groupings.
- Prefer flat page sections when a card adds no meaning.
Shape
Element
Direction
Structural container
0–2px radius
Input / button
2–4px radius
Grouped surface
4–6px radius
Pill
Only when genuinely status-like
Color
Blue is the default primary theme, not a permanent brand lock. Neutral colors should carry most of the
interface. Semantic colors are reserved for state.
Typography
- Use a small deliberate type scale.
- Keep headings strong without making them oversized.
- Keep labels close to their controls.
- Use monospace/tabular styles only when they improve data reading.

---

## 4. Tokens and theming

Tokens are the contract between the visual system and components. Components consume tokens rather than repeating hard-coded values.

### Token groups

- **Color:** primary, surface, background, text, muted, border, success, warning, danger, info.
- **Spacing:** a small scale such as 4, 8, 12, 16, 20, 24, 32, 40, 48, named `--gov-space-1` upward.
- **Typography:** family, size, weight, line-height.
- **Shape:** border width and radius.
- **Focus:** focus ring color, width and offset — **independent of the primary color**.
- **Density:** control heights and table row padding, switched as a mode.
- **Layout:** content widths and breakpoints.
- **Motion:** duration/easing only where useful.

### Two rules learned from the reference screens

**The focus ring must not derive from the primary color.** A navy focus ring on a navy primary button is invisible. GOV.UK uses a contrasting yellow for precisely this reason. `--gov-focus` is its own value, verified against every surface it can land on.

**Status colors must carry sufficient contrast for their own text.** Solid amber with white text — as used for the "On Leave" and "Late" badges in the reference screens — does not reach 4.5:1. Prefer a tinted background with dark text, and always pair the color with a text label or icon so meaning never rests on color alone.

### Example

```css
:root {
  --gov-primary: #0b2a55;
  --gov-primary-hover: #071d3d;

  --gov-background: #ffffff;
  --gov-surface: #f8fafc;
  --gov-text: #111827;
  --gov-text-muted: #64748b;
  --gov-border: #d7dee8;

  --gov-success: #15803d;
  --gov-warning: #b45309;
  --gov-danger: #b91c1c;
  --gov-info: #0369a1;

  /* Deliberately not derived from --gov-primary: a navy ring on a
     navy button is invisible. This value must stay legible on every
     surface, including the primary button itself. */
  --gov-focus: #ffdd00;
  --gov-focus-contrast: #0b0c0c;
  --gov-focus-width: 3px;
  --gov-focus-offset: 2px;

  --gov-radius-sm: 3px;
  --gov-radius-md: 5px;

  --gov-space-1: 4px;
  --gov-space-2: 8px;
  --gov-space-3: 12px;
  --gov-space-4: 16px;

  /* System stack first so nothing is downloaded: government networks
     are often locked down or offline, and the target device is a
     low-end phone on a slow connection. Indic faces follow as
     fallbacks rather than as a webfont. */
  --gov-font-sans:
    system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif,
    "Noto Sans", "Noto Sans Devanagari";

  /* Floor, not a preference. Devanagari matras sit above and below
     the baseline and clip at the ~1.2 heading line-height most design
     systems use. Bengali, Tamil and Gurmukhi behave the same way. */
  --gov-line-height-tight: 1.4;
  --gov-line-height-body: 1.6;
}
```

A department can override the primary color without touching component code:

```css
:root {
  --gov-primary: #005ea8;
  --gov-primary-hover: #004f8f;
}
```

Components should not care which blue is selected. They consume semantic variables.

---

## 5. Accessibility

Accessibility is an engineering requirement. GOV UI should make the accessible path the easiest path for application developers.

### Conformance target

Government procurement cannot adopt a design system on a general claim of accessibility. GOV UI states a target and publishes evidence against it.

| Commitment | Detail |
|---|---|
| Standard | **WCAG 2.2 Level AA**, jurisdiction-neutral |
| Evidence | **VPAT 2.5 ACR** published per minor release, in `docs/compliance/` |
| India | **GIGW 3.0 conformance mapping** published alongside the VPAT (see below) |
| Automated | `axe-core` gate in CI; zero violations across docs and reference application |
| Manual | Documented NVDA, JAWS and VoiceOver test matrix per interactive component |
| High contrast | `forced-colors: active` (Windows High Contrast) support is required, not optional |
| Motion | `prefers-reduced-motion` respected throughout |

Automated tooling catches roughly a third of real accessibility defects. The manual matrix is not optional and is part of a component's definition of done (section 19).

GOV UI supports conformance **at the component level**. It cannot certify an application or a site. Use the same discipline here as with security claims (section 13): describe what the library provides, never what the consuming application achieves.

### India readiness

Where GOV UI is proposed as a base for Indian government software, the relevant instruments are **GIGW 3.0** (MeitY / NIC), certified by **STQC**, and the statutory accessibility duty under the **RPwD Act 2016**. GIGW rests on the same WCAG success criteria, so the WCAG 2.2 AA commitment covers the substance — but Indian departments ask for a GIGW mapping, not a VPAT. Publish both.

Script support is a hard requirement and is addressed in the Internationalization section.

### Baseline rules

- Prefer semantic HTML before ARIA.
- Every form control needs an accessible name.
- Keyboard users must reach and operate interactive controls.
- Focus must remain visible.
- Dialog focus must be managed correctly.
- Important dynamic status and validation changes should be announced when needed.
- Errors should identify the field and explain how to fix it.
- Do not rely on hover for essential information.
- Respect reduced-motion preferences.
- Maintain sufficient contrast.
- Test with keyboard navigation and automated accessibility checks.

### Example

```html
<label for="employee-name">Employee name</label>
<input
  id="employee-name"
  name="employeeName"
  type="text"
  aria-describedby="employee-name-help"
/>
<p id="employee-name-help">
  Enter the employee's legal name.
</p>
```

---

## 6. Component strategy

### Build in layers

```text
Contract
 └─ component manifest: markup, classes, ARIA, variants
Foundation
 └─ tokens
Framework-free core
 └─ gov-ui.css (all styles) + gov-ui.js (all behavior)
Emitters
 └─ plain HTML · Razor · Django tags · Blade/Twig · WordPress · React
Patterns
 └─ forms, tables, navigation, search/filter, workflows
```

The manifest is the source of truth. Styles live only in the CSS layer and behavior only in the core; every emitter produces the documented markup and nothing else. Section 7 covers this.

### Initial components

- Button, Link, IconButton
- Input, Textarea, Select, Checkbox, Radio, Switch
- Label, Field, FieldGroup, Form
- Badge, StatusBadge, Alert
- Card, Divider
- Dialog, DropdownMenu, Tooltip
- Tabs, Breadcrumb, Pagination
- Table, DataTable
- Loading, EmptyState, ErrorState
- Container, Stack, Grid, Page, PageHeader
- Header, Sidebar, NavigationItem

### Government-critical components

These are required for public-sector work and are frequently missing from general-purpose systems. They are not optional extras.

- **ErrorSummary** — a summary at the top of a form linking to each failed field. This is the single pattern that most reliably carries a government form through an accessibility audit. Inline field errors alone are not sufficient.
- **SkipLink** and **BackLink**
- **NotificationBanner** — confirmation of a completed action
- **PhaseBanner** — Alpha / Beta service labelling
- **SessionTimeoutDialog** — a warning before an authenticated session expires, with the option to extend. Mandatory wherever sessions carry personal data.
- **CharacterCount**
- **ClassificationBanner** — data sensitivity marking (for example OFFICIAL, OFFICIAL-SENSITIVE). Specific to government and shipped by no comparable system.
- **TaskList** — the multi-step application pattern
- **ConfirmationPage** — receipt and reference number after submission

### Regional field patterns

Locale-specific inputs are a genuine gap in every existing system. Where GOV UI targets Indian government software, that means:

- `PinCodeInput` (6 digits), `MobileInput` (+91, 10 digits)
- `PanInput`, `GstinInput`, `IfscInput` — format masking and structural validation
- `AadhaarInput` — **masked display; never logged, never echoed back in an error message.** Masking is a legal requirement. This component handles presentation only and does not make an application Aadhaar-compliant; its documentation must say so plainly.
- Indian address hierarchy: state / district / tehsil / village

### Later patterns

- FilterBar, SearchBar
- FileUpload
- **DateInput** (three fields: day / month / year) and DateRangeInput
- StepIndicator
- AuditLog
- Timeline
- Confirmation workflow
- Government application form layouts

**Not a calendar DatePicker.** A three-field date input is the default. Calendar widgets are consistently the hardest control to make accessible, and they handle locale and era conventions badly; GOV.UK and USWDS both moved away from them for exactly this reason. A calendar may be added later as an optional enhancement layered on top of a working three-field input, never as the only way to enter a date.

Do not build the whole catalog immediately. Add a component when it is reusable, has a clear interaction model, and can be documented and tested.

---

## 7. Framework strategy

**The framework-free core is the product.** React is one consumer of it, not the centre of it.

Most public-sector software does not run on React. It runs on ASP.NET, Django, PHP and WordPress. A design system that ships working components only to React consumers hands everyone else a stylesheet with no Dialog that opens and no Select that works — which is the same as handing them nothing. GOV UI is built so that any stack gets the same components with the same behavior and the same accessibility.

### One markup contract, many emitters

```text
                component manifest  (the contract)
                          |
      +-------------------+-------------------+
      |                   |                   |
 gov-ui.css          gov-ui.js          markup emitters
 (all styles)      (all behavior)   Razor - Django tags - Blade/Twig
                                     WordPress - React - plain HTML
```

Three rules keep this sustainable for a small team:

1. **Emitters produce markup only.** No behavior, no styles, no logic in any adapter. Adding a component means adding one template per adapter — mechanical work, not architectural work. Behavior or styling inside an adapter is a bug.
2. **The manifest is the source of truth.** Each component's element, class names, ARIA attributes, slots and variants are declared once, machine-readably. Documentation, the HTML reference and every adapter's conformance test derive from it.
3. **Golden-HTML conformance runs in CI.** Every emitter renders the same fixture inputs and must produce equivalent DOM. If the Django template tag and the Razor tag helper disagree, the build fails. Community ports of other government design systems drift from their originals because nothing enforces this; here, something does.

**React is not privileged.** It does not wrap the vanilla core — imperative DOM code behind React refs fights hydration and server rendering. React reimplements the same behavior against the same manifest and the same ARIA contract, and is verified by the same test suite.

### Zero runtime dependencies

GOV UI uses no headless primitive library. All interaction behavior is written and owned by the project.

This costs real work: focus trapping, roving tabindex, typeahead and listbox semantics are genuinely difficult, and roughly six components carry nearly all of that difficulty. It is bounded, and it is paid once. In return, the behavior exists for every stack rather than only for React, and no third party can block a fix when an accessibility auditor files a bug. GOV.UK Frontend and USWDS both made the same choice.

### Progressive enhancement

Server-rendered consumers cannot assume JavaScript, and low-bandwidth users often do not get it.

- Every component is usable without JavaScript and enhances when it loads.
- Prefer native behavior first: `<select>` before a custom listbox, `<details>` for disclosure, forms that submit without script.
- `gov-ui.js` **auto-initializes** from `data-gov-module` attributes on `DOMContentLoaded`. A WordPress or Django developer adds one script tag and wires nothing.

### No build step, ever

Ship a plain `.css` file and a **UMD/IIFE** bundle — never ESM-only. Many PHP, WordPress and Razor projects have no bundler at all, and requiring one excludes them.

### Support tiers

| Tier | Artifact | Channel |
|---|---|---|
| 1 — core | `gov-ui.css` + `gov-ui.js` | CDN, zip download, npm |
| 1 — core | `@gov-ui/react` | npm |
| 2 — official adapter | .NET Razor tag helpers + static assets | NuGet |
| 2 — official adapter | Django template tags + static files | PyPI |
| 2 — official adapter | Laravel Blade components, Symfony Twig templates | Packagist |
| 3 — documented | WordPress plugin + copy-paste pattern library | WordPress.org |

Publish the tiers in the README. Honest expectations beat an implied promise of equal support everywhere.

### Plain HTML

The two-tag install is the primary path, not a footnote:

```html
<link rel="stylesheet" href="gov-ui.css">
<script src="gov-ui.js" defer></script>

<button class="gov-button gov-button--primary">
  Save
</button>
```

### React

```tsx
import { Button } from "@gov-ui/react";

export function SaveAction() {
  return <Button>Save</Button>;
}
```

### Server-rendered frameworks

```razor
<gov-button variant="primary">Save</gov-button>
```

```django
{% gov_button variant="primary" %}Save{% endgov_button %}
```

```blade
<x-gov-button variant="primary">Save</x-gov-button>
```

Each emits exactly the markup in the plain-HTML example above.

### Next.js

Next.js applications consume the React package. A separate Next.js package is unnecessary unless a genuine framework-specific need appears.

---

## 8. Repository architecture

### Monorepo

```text
gov-ui/
├── apps/
│   └── docs/                  # docs site; doubles as a11y + conformance test surface
├── packages/
│   ├── manifest/              # component markup contract (JSON) — source of truth
│   ├── css/                   # tokens + component styles      → gov-ui.css
│   ├── core/                  # vanilla JS behavior, UMD build  → gov-ui.js
│   └── react/                 # typed React components
├── adapters/                  # markup emitters only — no styles, no behavior
│   ├── dotnet/
│   ├── django/
│   ├── php/
│   └── wordpress/
├── fixtures/                  # golden HTML shared by every adapter conformance test
├── examples/
│   └── ems/                   # employee management reference application
├── docs/
│   ├── design-principles.md
│   └── compliance/            # VPAT, GIGW mapping, accessibility statement, SBOM
├── .github/
│   └── workflows/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── README.md
└── LICENSE
```

`packages/css` and `packages/core` together **are the product**. Everything else consumes them.

### Package responsibility

| Package | Responsibility |
|---|---|
| `@gov-ui/manifest` | Declares each component's markup, classes, ARIA and variants. Source of truth. |
| `@gov-ui/css` | Tokens and framework-independent styles. Ships `gov-ui.css`. |
| `@gov-ui/core` | All interaction behavior, framework-free. Ships `gov-ui.js` (UMD). Zero dependencies. |
| `@gov-ui/react` | Typed React components. Zero dependencies. |

### Start smaller than this

Do not create every package on day one. Begin with `css`, `core`, `manifest` and `react`; the adapters land once the core is proven. Splitting a token package out of `css` is warranted only when a real consumer needs the values without the styles.

**No icons package.** Inline the small number of SVGs the components actually need. Reconsider only if a consumer asks for a standalone set.

Keep the dependency graph understandable. If a package only saves a few imports, it probably does not need to exist.

---

## 9. React architecture

Keep each component close to its implementation and styles.

```text
packages/react/src/
├── button/
│ ├── Button.tsx
│ ├── button.css
│ ├── Button.test.tsx
│ └── index.ts
├── input/
│ ├── Input.tsx
│ ├── input.css
│ ├── Input.test.tsx
│ └── index.ts
└── index.ts
```

### Example

```tsx
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md";
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`gov-button gov-button--${variant} gov-button--${size} ${className}`}
      {...props}
    />
  );
}
```

The example is intentionally boring. Improve class composition only when repeated needs justify a small helper. Do not add a styling framework just to join class names.

- Use native element props where possible.
- Keep variants finite and meaningful.
- Avoid props that duplicate CSS.
- Do not expose every token as a component prop.
- Keep defaults predictable.

---

## 10. CSS architecture

The CSS layer should be understandable to someone who knows ordinary CSS. CSS variables are the theme contract; classes provide component styles.

```css
.gov-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: var(--gov-radius-sm);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.gov-button:focus-visible {
  outline: var(--gov-focus-width) solid var(--gov-focus);
  outline-offset: var(--gov-focus-offset);
}

.gov-button--primary {
  background: var(--gov-primary);
  color: white;
}

.gov-button--secondary {
  background: var(--gov-background);
  color: var(--gov-text);
  border-color: var(--gov-border);
}
```

- Prefer stable GOV-prefixed class names.
- Use variables for shared values.
- Avoid deep selectors and specificity battles.
- Avoid global styling except deliberate base/reset rules.
- Do not require CSS-in-JS.
- Keep motion minimal and respect reduced motion.

---

## 11. API and naming conventions

- PascalCase for React components: `Button`, `DataTable`, `PageHeader`.
- Use semantic variant names: `primary`, `secondary`, `danger`, `subtle`.
- Prefer semantic names over appearance names.
- Use status names such as `success`, `warning`, `danger`, `neutral`.
- Use a consistent GOV prefix for CSS classes.

### Good API

```tsx
<Button>Save</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="danger">Delete</Button>
```

### Avoid

```tsx
<Button
  color="#0b2a55"
  radius="2px"
  shadow="none"
  animation="soft"
  textWeight="600"
  iconPosition="left"
/>
```

Applications choose semantic variants and content, not dozens of visual implementation details.

---

## 12. Forms, tables, navigation and patterns

### Forms

- Every field supports label, help text, validation and relevant disabled/read-only states.
- Errors stay close to the affected field.
- Long forms use meaningful sections and clear progression.
- Do not hide required information behind tooltips.

### Data tables

- Tables are a flagship pattern for administrative software.
- Support loading, empty, error, sorting, pagination and selection where appropriate.
- Use clear headings and predictable row actions.
- Do not turn every table into a dense analytics dashboard.

### Navigation

- Support sidebar and header patterns.
- Use accessible current-page semantics.
- Keep labels explicit.
- Do not rely only on icons for primary navigation.

### Status

```tsx
<StatusBadge status="active" />
<StatusBadge status="pending" />
<StatusBadge status="rejected" />
```

Use consistent semantic mappings: success for approved/active/completed, warning for pending/late, danger for rejected/failed, neutral for draft/inactive.

---

## 13. Security-minded engineering

GOV UI should be security-conscious without pretending that a UI library can secure an application.

### Library responsibilities

- Avoid unsafe HTML injection APIs unless a deliberate escape hatch is required.
- Prefer React's normal escaping.
- Avoid unnecessary runtime code and dependencies.
- Document safe handling of URLs, files and user-provided content.
- Do not encourage secrets in client-side code.
- Provide confirmation patterns for destructive actions; authorization remains the application's job.
- Keep dependencies maintained and audited.

### Application responsibilities

- Authentication and identity.
- Authorization and role enforcement.
- Session and CSRF protections.
- Server-side input validation.
- Database and API security.
- File scanning and storage security.
- Encryption and secrets management.

Use language such as **"security-minded defaults"** rather than claiming the library makes an application secure.

---

## 14. Maintainable code rules

The project should be readable by a developer who joins six months later. Human-written, boring code is a feature.

- Prefer explicit code over clever abstractions.
- Keep functions short when useful, but avoid meaningless one-line helpers.
- Use names that explain purpose.
- Comment why a non-obvious decision exists, not what obvious code does.
- Avoid premature generic utilities.
- Do not introduce a state machine unless the interaction genuinely needs one.
- Do not build configuration systems for simple constants.
- Delete dead code.
- Keep public APIs smaller than internal implementation details.
- Document important architectural decisions.

### Good comment

```ts
// Keep the native button element so keyboard behavior and
// browser semantics remain predictable.
```

### Weak comment

```ts
// This is a button.
```

Before adding a dependency, ask whether the browser, React, or a small local function can solve the problem clearly.

---

## 15. Testing

### Testing pyramid

```text
Unit / utility tests
        ↓
Component + accessibility tests
        ↓
Browser / integration tests
        ↓
Reference application checks
```

- Test rendering, variants, disabled states and important user interactions.
- Test keyboard and focus behavior.
- Test validation and error behavior.
- Use automated accessibility checks.
- Use Playwright for important workflows.
- Add visual regression after the visual system stabilizes.

### Release quality gates

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

---

## 16. Documentation

Documentation is part of the product. A component that is difficult to understand will not be adopted consistently.

### Every component page

- Live example.
- Basic usage code.
- Variants and states.
- Accessibility notes.
- When to use / when not to use.
- HTML equivalent where available.
- API reference.
- Related components.

### Tone

Write like a senior engineer explaining a system to another engineer: direct, specific and free of marketing language. Avoid unnecessary claims such as “revolutionary” or “AI-powered”.

---

## 17. Releases and versioning

Use semantic versioning for published packages. Even before 1.0, clearly document breaking changes.

| Change | Version direction |
|---|---|
| Bug fix, docs, internal refactor | Patch |
| Backward-compatible feature | Minor |
| Breaking public API/behavior | Major |

### Release checklist

- Run lint, typecheck, tests and build.
- Check package output and bundle size.
- Review dependency changes.
- Update changelog.
- Document breaking changes.
- Verify documentation examples.
- Confirm the reference application still works.

### License

The project direction is the **MIT License** so developers and organizations can use, modify and distribute GOV UI with minimal friction. Treat the GOV UI name, logos and other brand assets separately from the source-code license.

---

## 18. Roadmap

Ship a narrow vertical slice before a broad catalog. One screen built end to end teaches more than twenty half-finished components.

### Phase 0 — Define

- Finalize principles.
- Extract visual rules from reference screens.
- Define token names and scales.
- Choose typography and icon strategy.
- Set the accessibility baseline and conformance target.

### Phase 1 — Foundation

- Implement tokens, including focus, density, high-contrast and script-safe line-height.
- Implement the framework-independent CSS foundation.
- Stand up the component manifest and the golden-HTML conformance harness while the component count is still small.

### Phase 2 — v0.1 vertical slice

Build only what the reference Employees screen needs, complete: `Page`, `PageHeader`, `Toolbar`, `Button`, `Input`, `Select`, `Table`, `StatusBadge`, `Pagination`, `Breadcrumb`.

All ten are plain semantic HTML requiring no JavaScript, which makes this the cheapest place to prove the universal claim. Each ships as a manifest entry, CSS, a React component and a plain-HTML reference, with tests and documentation.

### Phase 3 — v0.2 government-critical components

ErrorSummary first, then SkipLink, BackLink, NotificationBanner, PhaseBanner, SessionTimeoutDialog, DateInput, CharacterCount, ClassificationBanner, TaskList, ConfirmationPage.

### Phase 4 — v0.3 interaction milestone

Hand-written Dialog, DropdownMenu, Tabs, Select (upgraded to a real listbox), Tooltip and Switch — in both the framework-free core and React, against one shared ARIA and keyboard contract and one shared test suite.

### Phase 5 — Adapters and distribution

Django first (its form layer maps onto ErrorSummary particularly well), then .NET Razor and PHP. Build the single-tag multi-channel release job **before** the second adapter exists.

### Phase 6 — Reference application and pilot

Employee Management System, then one real pilot deployment. Adoption in the public sector comes from a reference customer, not from demo applications.

### Phase 7 — Production hardening

- Accessibility review and published VPAT / GIGW mapping.
- Browser and assistive-technology matrix.
- Visual regression.
- Dependency audit and SBOM.
- Bundle-size monitoring against a hard budget.

---

## 19. Definition of done

A component is ready for public use when:

- Its purpose is clear.
- Its API is small and understandable.
- Its visual behavior uses tokens.
- Keyboard and focus behavior are correct.
- Important states are implemented.
- It has component tests.
- Accessibility coverage is appropriate.
- Documentation and examples exist.
- It works in the reference application.
- It adds **no** runtime dependency.
- It renders correctly with JavaScript disabled.
- It survives `forced-colors: active`, 200% zoom and `dir="rtl"`.
- A manual keyboard walkthrough is recorded in its documentation page, and for interactive components a screen-reader pass as well.
- Every emitter renders it to equivalent markup, verified by the conformance suite.

A component is **not** done merely because it looks correct in one screenshot.

---

## 20. Reference implementation

### Example page composition

```tsx
export function EmployeesPage() {
  return (
    <Page>
      <PageHeader
        title="Employees"
        description="Manage employee records."
        action={<Button>Add employee</Button>}
      />

      <Toolbar>
        <Input
          aria-label="Search employees"
          placeholder="Search employees"
        />

        <Select aria-label="Department">
          <option>All departments</option>
          <option>Engineering</option>
          <option>Finance</option>
        </Select>
      </Toolbar>

      <DataTable columns={columns} rows={employees} />
    </Page>
  );
}
```

### Example layout CSS

```css
.gov-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 24px;
}

.gov-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.gov-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
```

### Developer workflow

- Start with semantic HTML.
- Choose the GOV UI component matching the semantic need.
- Use a token instead of an arbitrary value.
- Add only necessary application-specific CSS.
- Add or update tests.
- Update docs when the public API changes.

---

## 21. Internationalization

Multilingual delivery is a legal requirement in much of the public sector — Canada, Wales, the European Union and India among them. Retrofitting it is expensive, so the constraints belong in the foundation.

### Layout direction

- Use **logical CSS properties** throughout: `padding-inline`, `margin-block`, `border-inline-start`, `inset-inline-end`. Never `left` or `right`.
- Verify `dir="rtl"` in the documentation site. A component that breaks under RTL is not done.

### Script support

Latin-centric defaults quietly break other writing systems:

- **Set a minimum line-height floor.** Devanagari matras extend above and below the baseline and clip at the tight heading line-heights (around 1.2) that most modern design systems use. The same applies to Bengali, Tamil and Gurmukhi. Keep tight line-height no lower than roughly 1.4.
- Include **Indic fallbacks** in the font stack, after the system faces.
- Set `lang` attributes correctly so the right font and voice are selected.
- Never place text in an image.

### Text handling

- No string concatenation to build user-facing sentences; word order differs between languages.
- Test layouts against long strings. Hindi and German both run substantially longer than English, and fixed-width controls are where that shows first.

### Formatting

- Respect locale date order — **DD/MM/YYYY** for India and much of the world, not a US default.
- Use `Intl.NumberFormat` with the correct locale. Indian digit grouping is **lakh and crore** (`en-IN`), not thousands, and it appears in every amount column in an administrative table.

---

## 22. Decisions and non-goals

| Decision | Direction |
|---|---|
| Positioning | Admin-first: internal public-sector administration software. Citizen-facing patterns follow later. |
| Core product | The framework-free `gov-ui.css` + `gov-ui.js` layer. React is one consumer among several. |
| Consumer ecosystems | Plain HTML, .NET Razor, Django, PHP (Laravel/Twig), WordPress, React/Next.js |
| Interaction primitives | **None.** No headless library. All behavior is written and owned by the project. |
| Runtime dependencies | **Zero**, in every published package |
| Distribution | CDN and zip alongside npm, NuGet, PyPI, Packagist. No build step is ever required. |
| Accessibility | WCAG 2.2 AA, with a VPAT and a GIGW 3.0 mapping published per release |
| Internationalization | Logical properties, RTL-verified, Indic-script safe |
| Visual direction | Blue + neutral, restrained and square |
| License | MIT |
| Architecture | Small packages, clear boundaries, one markup contract |
| Code philosophy | Human-written, readable, no over-engineering |
| Security claim | Security-minded UI practices; no application-security claims |
| Name and branding | Deferred. Working name `gov-ui`; settle before the first public release. |

### Non-goals

- Not an application architecture.
- Not an authentication or authorization framework.
- Not a CSS-in-JS framework.
- Not an animation-first library.
- Not a dashboard template collection.
- Not hundreds of components on day one.
- Not a requirement that every consumer use Next.js.
- Not a visual clone of one application.
- Not a React-only library.
- Not ESM-only, and never dependent on a build step.
- Not a claim of GIGW, Section 508 or EAA certification for a consuming application.
- Not affiliated with or endorsed by any government. No state emblem, seal, crown or other official insignia is used or shipped.

### Final direction

GOV UI should feel like infrastructure. It should disappear behind the application and make the application feel clear, reliable and familiar. The best implementation is usually the one with fewer layers, fewer dependencies, fewer surprises and a smaller public API.

### Next milestone

Create the monorepo, establish the token layer, document the design principles, and build the first primitives. Validate the foundation in a real employee-management workflow before expanding the catalog.

---
