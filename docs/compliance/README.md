# Compliance

Accessibility conformance evidence for GOV UI.

> **Scope.** GOV UI supports conformance **at the component level**. It cannot certify an application or a service. A team building on GOV UI still owns its own content, information architecture, server-side validation and end-to-end testing — and its own accessibility statement. Treat everything here as evidence to draw on, not as a certificate to inherit.

---

## Target

| Commitment | Detail |
|---|---|
| Standard | WCAG 2.2 Level AA |
| Evidence | VPAT 2.5 ACR, published per minor release |
| India | GIGW 3.0 conformance mapping, published alongside the VPAT |
| Automated | `axe-core` gate in CI — zero violations |
| Manual | NVDA, JAWS and VoiceOver matrix per interactive component |
| High contrast | `forced-colors: active` support required |
| Zoom | Usable at 200% |
| Direction | Verified under `dir="rtl"` |

Automated tooling catches roughly a third of real accessibility defects. The manual matrix is not optional and is part of a component's definition of done.

---

## Jurisdiction mapping

The WCAG 2.2 AA commitment is the substance. These are the instruments that reference it, for teams who need to cite one.

| Jurisdiction | Instrument | Notes |
|---|---|---|
| United States | Section 508; ADA Title II | VPAT 2.5 ACR is the expected artifact |
| European Union | EN 301 549; European Accessibility Act | Public sector and, increasingly, private |
| United Kingdom | Public Sector Bodies Accessibility Regulations 2018 | |
| India | GIGW 3.0 (MeitY / NIC); RPwD Act 2016 | Conformance certified by **STQC**. Indian departments ask for a GIGW mapping, not a VPAT — hence both. |
| Canada | ACA; Standard on Web Accessibility | Bilingual delivery is a separate statutory duty |

---

## What is automated today

These run on every pull request and block the build. They are a floor, not a conformance claim.

| Gate | What it checks | Command |
|---|---|---|
| Contrast | Every color pair the system depends on meets its WCAG minimum, measured from the shipped tokens | `npm run check:contrast` |
| Conformance | Every emitter produces the agreed markup, so ARIA and semantics cannot drift per framework | `npm run check:conformance` |
| Budget | Payload stays within the gzipped limits, because performance is an accessibility issue on a low-end device | `npm run check:budget` |

The contrast gate is worth a note: it parses `packages/css/src/tokens.css` and computes ratios from the values that actually ship, so the numbers in this directory cannot drift from the palette. A palette change that breaks a pair fails CI rather than a later audit.

---

## Planned artifacts

Not yet written — listed so the gap is visible rather than implied.

- `vpat-2.5-acr.md` — populated once the v0.1 component set is complete
- `gigw-3.0-mapping.md` — GIGW clause to WCAG success criterion to component
- `accessibility-statement-template.md` — a starting point consumers adapt
- `screen-reader-matrix.md` — per component, per assistive technology, with dates and versions
- `sbom.json` — trivial while the dependency count is zero, and worth publishing precisely because of that

---

## Reporting a problem

Accessibility defects are treated as correctness bugs, not enhancements. Open an issue with the component, the assistive technology and version, and what you expected.
