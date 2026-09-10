# GOV UI

**Lightweight UI for government software.**

An accessible, framework-friendly design system for building clean, trustworthy public-sector applications — admin tools, records systems, caseworker interfaces and the forms that feed them.

> **Not affiliated with, or endorsed by, any government.** GOV UI is an independent open-source project. It ships no state emblem, seal, crown or other official insignia, and adopting it does not certify a service against any accessibility standard.

**Status: pre-release (0.0.0).** The foundation is in place; components arrive in v0.1. See the [roadmap](GOV_UI_Project_Specification.md#18-roadmap).

---

## Why this exists

The GOV.UK Design System, USWDS and their equivalents are mature and well audited. Where they fit, use them.

They are built for **citizen-facing transactional services** — one question per page, large type, low density. That is right for someone applying for a licence once a year, and wrong for a caseworker processing four hundred records a day. Governments that adopt those systems for their public sites still hand-roll their internal admin interfaces.

GOV UI fills that gap, and is complementary to them rather than competing.

## What makes it different

**It works everywhere, not just in React.** Most public-sector software runs on ASP.NET, Django, PHP and WordPress. Shipping working components only to React consumers hands everyone else a stylesheet with no dialog that opens. So the framework-free layer is the product, and React is one consumer of it.

**Zero runtime dependencies.** No headless primitive library. All interaction behavior is written and owned here, which is what lets it exist for every stack — and means nothing external blocks a fix when an auditor files a bug.

**One markup contract, mechanically enforced.** Every component's markup is declared once, and every emitter is checked against it in CI. Community ports of other design systems drift because nothing verifies that a Django tag and a Razor tag helper still agree. Here, something does.

**Accessibility with evidence, not adjectives.** WCAG 2.2 AA, with a published VPAT and GIGW 3.0 mapping per release, and a contrast gate that measures the tokens that actually ship.

---

## Install

### Plain HTML — the primary path

No build step, no bundler, no package manager:

```html
<link rel="stylesheet" href="gov-ui.css">
<script src="gov-ui.js" defer></script>

<button class="gov-button gov-button--primary">Save</button>
```

Components initialize themselves from `data-gov-module` attributes. There is no wiring code.

### React

```bash
npm install @gov-ui/react @gov-ui/css
```

```tsx
import { Button } from "@gov-ui/react";

<Button>Save</Button>;
```

### Server-rendered frameworks

Adapters emit exactly the markup above — no styles or behavior of their own.

```razor
<gov-button variant="primary">Save</gov-button>
```

```django
{% gov_button variant="primary" %}Save{% endgov_button %}
```

```blade
<x-gov-button variant="primary">Save</x-gov-button>
```

---

## Support tiers

Published so expectations are honest. Five ecosystems is real maintenance surface, and pretending everything gets equal attention would be a promise this project cannot keep.

| Tier | What | Channel |
|---|---|---|
| **1 — core** | `gov-ui.css` + `gov-ui.js` | CDN, zip, npm |
| **1 — core** | `@gov-ui/react` | npm |
| **2 — official adapter** | .NET Razor tag helpers | NuGet |
| **2 — official adapter** | Django template tags | PyPI |
| **2 — official adapter** | Laravel Blade / Symfony Twig | Packagist |
| **3 — documented** | WordPress plugin + pattern library | WordPress.org |

---

## Theming

Override custom properties. No component code changes, and no recompile:

```css
:root {
  --gov-primary: #005ea8;
  --gov-primary-hover: #004f8f;
}
```

Density is a mode, not a prop:

```html
<div data-gov-density="compact"> ... </div>
```

---

## Development

The foundation needs **no dependencies to build or test itself** — Node's built-in test runner does the work. A zero-dependency library whose own tooling pulls in three hundred packages has moved the supply-chain problem, not solved it.

```bash
npm run build      # build gov-ui.css and gov-ui.js
npm test           # run the test suite
npm run verify     # everything CI runs
```

Individual gates:

```bash
npm run check:contrast     # every token pair meets its WCAG minimum
npm run check:conformance  # every emitter matches the golden markup
npm run check:deps         # no package carries a runtime dependency
npm run check:budget       # payload within the gzipped limits
```

After changing a component manifest, regenerate the goldens so the markup contract change is visible in review:

```bash
npm run conformance:update
```

---

## Documentation

- [Project specification](GOV_UI_Project_Specification.md) — design, architecture and engineering decisions
- [Design principles](docs/design-principles.md)
- [Compliance](docs/compliance/) — accessibility conformance and evidence
- [CLAUDE.md](CLAUDE.md) — implementation rules for coding agents

## License

MIT. The code license and the GOV UI name are separate concerns.
