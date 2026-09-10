<div align="center">

<img src="assets/banner.svg" alt="GOV UI — lightweight UI for government software" width="100%">

<br>

**An accessible, framework-independent design system for public-sector software.**

Admin tools · records systems · caseworker interfaces · the forms that feed them

<br>

![Status](https://img.shields.io/badge/status-pre--release%20v0.1-b45309?style=flat-square)
![Runtime dependencies](https://img.shields.io/badge/runtime%20dependencies-0-15803d?style=flat-square)
![Tests](https://img.shields.io/badge/tests-217%20passing-15803d?style=flat-square)
![Accessibility](https://img.shields.io/badge/target-WCAG%202.2%20AA-0369a1?style=flat-square)
![CSS size](https://img.shields.io/badge/css-7.2%20KB%20gzipped-0369a1?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-0b2a55?style=flat-square)

</div>

> [!IMPORTANT]
> **Not affiliated with, or endorsed by, any government.** GOV UI is an independent
> open-source project. It ships no state emblem, seal, crown or other official
> insignia, and adopting it does not certify a service against any accessibility
> standard.

---

## Why this exists

The GOV.UK Design System, USWDS and their equivalents are mature and well audited. **Where they fit, use them.**

They are built for **citizen-facing transactional services** — one question per page, large type, low density. That is right for someone applying for a licence once a year, and wrong for a caseworker processing four hundred records a day.

So governments adopt them for their public sites, then hand-roll their internal admin interfaces anyway. Dense tables, bulk actions, filter toolbars, audit trails and record detail views are simply out of scope for those systems.

**GOV UI fills that gap** — and is complementary to them, not competing.

---

## What makes it different

<table>
<tr>
<td width="50%" valign="top">

### It works everywhere

Most public-sector software runs on **ASP.NET, Django, PHP and WordPress** — not React. Shipping working components only to React consumers hands everyone else a stylesheet with no dialog that opens.

So the framework-free layer *is* the product. React is one consumer of it.

</td>
<td width="50%" valign="top">

### Zero runtime dependencies

No headless primitive library. All interaction behavior is written and owned here.

That is what lets it exist for every stack — and means nothing external stands between a reported accessibility bug and its fix.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### One contract, mechanically enforced

Every component's markup is declared **once**, and every emitter is checked against it in CI.

Community ports of other design systems drift because nothing verifies that a Django tag and a Razor tag helper still agree. Here, something does.

</td>
<td width="50%" valign="top">

### Accessibility with evidence

WCAG 2.2 AA, with a contrast gate that measures the **tokens that actually ship** — not a claim in a readme.

24 colour pairs, verified on every commit.

</td>
</tr>
</table>

---

## Quick start

<details open>
<summary><b>Plain HTML</b> — the primary path, no build step</summary>

<br>

```html
<link rel="stylesheet" href="gov-ui.css">
<script src="gov-ui.js" defer></script>

<button class="gov-button gov-button--primary gov-button--md" type="button">Save</button>
```

Components initialise themselves from `data-gov-module` attributes. There is no wiring code to write, no bundler, and no package manager.

</details>

<details>
<summary><b>React</b></summary>

<br>

```bash
npm install @gov-ui/react @gov-ui/css
```

```tsx
import { Page, PageHeader, Toolbar, Button, Input, Table } from "@gov-ui/react";

export function EmployeesPage() {
  return (
    <Page>
      <PageHeader title="Employees" description="Manage your team members and their roles.">
        <Button>Add employee</Button>
      </PageHeader>

      <Toolbar as="form" method="get">
        <Input name="search" label="Search employees" type="search" />
      </Toolbar>

      <Table caption="Employees" columns={columns} rows={employees} />
    </Page>
  );
}
```

</details>

<details>
<summary><b>Server-rendered frameworks</b> — .NET, Django, PHP</summary>

<br>

Adapters emit exactly the markup in the plain-HTML example. They carry no styles and no behavior of their own — anything else in an adapter is a bug.

```razor
@* .NET Razor *@
<gov-button variant="primary">Save</gov-button>
```

```django
{# Django #}
{% gov_button variant="primary" %}Save{% endgov_button %}
```

```blade
{{-- Laravel Blade --}}
<x-gov-button variant="primary">Save</x-gov-button>
```

> Adapters are **not built yet.** They land after the interaction milestone, so they have a stable contract to conform to. Django goes first — its form layer maps onto `ErrorSummary` particularly well.

</details>

---

## Architecture

```
                    component manifest  ← the contract
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   gov-ui.css            gov-ui.js            markup emitters
   (all styles)        (all behavior)    Razor · Django · Blade
                                          WordPress · React · HTML
```

Three rules keep five ecosystems maintainable by a small team:

| # | Rule | Why |
|---|---|---|
| **1** | Emitters produce **markup only** | Behavior or styling in an adapter is a bug. Adding a component means adding one template per adapter — mechanical, not architectural. |
| **2** | The **manifest is the source of truth** | Element, classes, ARIA, slots and variants declared once. Docs, fixtures and every conformance test derive from it. |
| **3** | **Golden-HTML conformance in CI** | Every emitter renders the same fixtures to equivalent DOM, or the build fails. |

**React is not privileged.** It does not wrap the vanilla core — imperative DOM code behind React refs fights hydration and server rendering. React reimplements the same behavior against the same contract, verified by the same tests.

---

## Components

**v0.1** — every one ships as a manifest entry, CSS, a React component, a plain-HTML reference and generated docs.

| Layout | Forms | Data | Navigation |
|---|---|---|---|
| `Page` | `Input` | `Table` | `Breadcrumb` |
| `PageHeader` | `Select` | `StatusBadge` | `Pagination` |
| `Toolbar` | `Button` | | |

<details>
<summary><b>Coming next</b></summary>

<br>

**v0.2 — government-critical.** The components general-purpose systems leave out:

- **`ErrorSummary`** — top-of-form summary linking to each failed field. The single pattern that most reliably carries a government form through an accessibility audit.
- **`SessionTimeoutDialog`** — mandatory wherever sessions carry personal data
- **`ClassificationBanner`** — data sensitivity marking (OFFICIAL, OFFICIAL-SENSITIVE). Shipped by no comparable system.
- **`DateInput`** — three fields, *not* a calendar picker. Calendar widgets are the hardest control to make accessible and handle locale badly; GOV.UK and USWDS both moved away from them.
- `SkipLink` · `BackLink` · `NotificationBanner` · `PhaseBanner` · `CharacterCount` · `TaskList` · `ConfirmationPage`

**v0.3 — the interaction milestone.** Hand-written `Dialog`, `DropdownMenu`, `Tabs`, `Select` as a real listbox, `Tooltip`, `Switch` — in both the framework-free core and React, against one shared ARIA and keyboard contract.

**Regional field patterns.** A genuine gap in every existing system: `PinCodeInput`, `MobileInput` (+91), `PanInput`, `GstinInput`, `IfscInput`, `AadhaarInput` (masked display, never logged), and the Indian address hierarchy.

</details>

---

## Theming

Override custom properties. No component changes, no recompile — unlike systems that theme at Sass compile time, one build serves many departments.

```css
:root {
  --gov-primary: #005ea8;
  --gov-primary-hover: #004f8f;
}
```

Density is a **mode**, not a prop threaded through every component:

```html
<div data-gov-density="compact"> … </div>
```

<details>
<summary><b>Two tokens that are easy to get wrong</b></summary>

<br>

**The focus ring is not derived from the primary colour.** A navy ring on a navy primary button is invisible. Yellow alone does not solve it either — `#ffdd00` is about **1.1:1** against a white page. The ring is two-tone: a yellow band inside a dark one, so whichever surface it lands on, one of its edges carries the contrast.

**There are two border tokens**, because a decorative table rule and the edge of a text input have different jobs. WCAG 2.2 requires 3:1 for the latter (SC 1.4.11) and nothing for the former.

| Token | Use | Contrast on white |
|---|---|---|
| `--gov-border` | Decoration: table rules, dividers | 1.4:1 |
| `--gov-border-strong` | Control edges: inputs, secondary buttons | 4.6:1 |

Collapsing them into one light grey is among the most common ways a design system quietly fails that criterion. A test enforces the split.

</details>

---

## Accessibility

> GOV UI supports conformance at the **component** level. It cannot certify an application. A team building on it still owns its own content, information architecture, server-side validation and end-to-end testing.

| Commitment | Detail |
|---|---|
| **Standard** | WCAG 2.2 Level AA |
| **Evidence** | VPAT 2.5 ACR per minor release |
| **India** | GIGW 3.0 conformance mapping, certified by STQC |
| **High contrast** | `forced-colors: active` supported |
| **Internationalisation** | Logical properties throughout; RTL verified; Indic-script safe |

The evidence lives in [`docs/compliance/`](docs/compliance/).

**What runs on every commit:**

```
✓ contrast     24/24 colour pairs meet their WCAG minimum
✓ conformance  35/35 golden cases match across every emitter
✓ dependencies no package carries a runtime dependency
✓ budget       CSS 7.2 KB · JS 1.8 KB gzipped
✓ tests        217 passing
```

<details>
<summary><b>Decisions worth knowing about</b></summary>

<br>

- **The error message renders above the control.** A screen reader user reaches it before editing, and a mobile keyboard cannot cover it.
- **Field ids derive from the field name**, so `for`, `aria-describedby` and any `ErrorSummary` link always agree. Wiring these by hand is the most common accessibility defect in government forms.
- **The table's scroll container is focusable.** A horizontally scrolling region nothing can focus is unreachable by keyboard — invisible on a desktop, obvious on a phone.
- **Line-height is floored at 1.4.** Devanagari matras sit above and below the baseline and clip at the ~1.2 heading line-height most design systems use. Bengali, Tamil and Gurmukhi behave the same way.
- **Status is never conveyed by colour alone.** Badges use a tinted surface with dark text and always carry a written label.

**Not yet automated:** browser-level checks — axe, forced-colors, 200% zoom and RTL rendering. Everything verified today is static analysis and DOM comparison, which is genuinely useful but is not the same as testing rendered output.

</details>

---

## Development

The foundation needs **no dependencies to build or test itself** — Node's built-in test runner does the work. A zero-dependency library whose own tooling pulls in three hundred packages has moved the supply-chain problem, not solved it.

```bash
npm install        # dev toolchain only: React + TypeScript
npm run build      # gov-ui.css, gov-ui.js, React package, docs site
npm test           # 217 tests
npm run verify     # everything CI runs
```

<details>
<summary><b>Individual gates</b></summary>

<br>

```bash
npm run check:contrast     # every token pair meets its WCAG minimum
npm run check:conformance  # every emitter matches the golden markup
npm run check:deps         # no package carries a runtime dependency
npm run check:budget       # payload within the gzipped limits
npm run check:examples     # the React example typechecks against the public API
```

After changing a component manifest, regenerate the goldens so the contract change is visible in review:

```bash
npm run conformance:update
```

</details>

<details>
<summary><b>Repository layout</b></summary>

<br>

```
packages/
  manifest/   markup contract (JSON) — source of truth
  css/        tokens + styles       → gov-ui.css
  core/       vanilla behavior, UMD → gov-ui.js
  react/      typed React components
adapters/     markup emitters only — no styles, no behavior
fixtures/     golden HTML, shared by every conformance test
apps/docs/    static documentation site
examples/     plain-HTML and React reference pages
```

`packages/css` and `packages/core` together **are the product**. Everything else consumes them.

</details>

---

## Documentation

**[himubey.is-a.dev/gov-ui](https://himubey.is-a.dev/gov-ui/)**

Or build and read it locally:

```bash
npm run build:docs
open apps/docs/dist/index.html
```

A static site — 14 pages, no framework, no bundler. The same constraints the library places on its consumers, applied to its own documentation.

Every live example is the **golden markup**, rendered verbatim. The documentation physically cannot show markup that has not shipped.

---

## Project principles

> **Simple code is not lower quality. For GOV UI, simplicity is a product requirement.**

It should feel like **infrastructure** — disappearing behind the application, making it clear, reliable and familiar. Users of government software rarely chose to be there; they are renewing a licence, filing a return or working a case queue. The interface earns its keep by being predictable, not memorable.

See [`docs/design-principles.md`](docs/design-principles.md) for the reasoning behind
each decision, [`CONTRIBUTING.md`](CONTRIBUTING.md) for the engineering guide, and
[`GOV_UI_Project_Specification.md`](GOV_UI_Project_Specification.md) for the full
specification and roadmap.

---

## Licence

[MIT](LICENSE). The code licence and the GOV UI name are separate concerns.

<div align="center">
<br>
<sub>Built for the public sector · Independent · No affiliation with any government</sub>
</div>
