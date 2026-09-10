# Design principles

The rules behind the visual and engineering decisions, and the reasoning that produced them. Where a principle exists because of a specific failure mode, the failure mode is stated — a rule whose reason has been lost gets deleted by the next person.

---

## 1. It should feel like infrastructure

GOV UI should disappear behind the application. Users of government software rarely chose to be there; they are renewing a licence, filing a return or working a case queue. The interface earns its keep by being predictable, not by being memorable.

This rules out a lot: decorative gradients, glass effects, oversized rounded cards, animation that does not communicate state, and dashboards assembled from tiles that exist to fill space.

## 2. Borders before shadows, typography before color

Hierarchy comes from type, spacing, alignment and thin borders. Color is reserved for meaning.

Radii stay small — 0–2px for structural containers, 2–4px for controls, 4–6px for grouped surfaces. The large-radius look reads as consumer software, and this is not consumer software.

## 3. Density is a real requirement

The reference screens spend around 90px of row height on one line of text. A caseworker working a long queue wants closer to 40. Both are legitimate, so density is a **token-level mode** set once on a container, never a prop threaded through every component.

## 4. Accessibility is measured, not asserted

"Accessible" as an adjective is worthless in procurement. The project states a target (WCAG 2.2 AA), publishes evidence (VPAT, GIGW 3.0 mapping) and gates the parts that can be automated.

Three specific things that generic design systems get wrong, and which are therefore checked here:

**The focus ring cannot derive from the primary color.** A navy ring on a navy primary button is invisible. Yellow alone does not solve it either — `#ffdd00` is about 1.1:1 against a white page. The ring is two-tone, a yellow band inside a dark one, so whichever surface it lands on, one of its edges carries the contrast.

**One border token is not enough.** A decorative table rule and the edge of a text input have different jobs. WCAG 2.2 requires 3:1 for the latter (SC 1.4.11) and nothing for the former. Collapsing them into a single light grey is one of the most common ways a design system quietly fails that criterion, so `--gov-border` and `--gov-border-strong` are separate and a test enforces the split.

**Status must not rest on color.** Solid amber with white text — as in the reference screens — does not reach 4.5:1. Status badges use a tinted surface with dark text, always paired with a text label.

## 5. Latin-centric defaults are bugs

Multilingual delivery is a legal requirement across much of the public sector, and the defaults that feel neutral are not.

Heading line-height of 1.2 clips Devanagari matras, which sit above and below the baseline; Bengali, Tamil and Gurmukhi behave the same way. The tight line-height is floored at 1.4 and a test enforces it. Physical CSS properties (`left`, `right`) break under RTL, so only logical properties are used. Date order is locale-dependent, and Indian digit grouping is lakh and crore rather than thousands.

None of this is expensive now. All of it is expensive later.

## 6. The framework-free layer is the product

Most public-sector software does not run on React. A design system that ships working components only to React consumers has excluded most of its users.

So behavior lives in one dependency-free JavaScript file, styles in one stylesheet, and every framework — React included — is an emitter of the same markup contract. React is not privileged, and it does not wrap the vanilla core: imperative DOM code behind React refs fights hydration and server rendering.

## 7. Own the hard parts

No headless primitive library. Focus trapping, roving tabindex, typeahead and listbox semantics are genuinely difficult, and roughly six components carry nearly all of that difficulty.

The cost is bounded and paid once. In return, the behavior exists for every stack, and no third party stands between a reported accessibility bug and its fix.

## 8. Drift is a mechanical problem, so solve it mechanically

Community ports of other government design systems fall behind their originals because nothing checks that they still agree. Good intentions do not survive a busy quarter.

Every component's markup is declared once as data. Every emitter is rendered against it and compared on DOM equivalence in CI. A Django tag that disagrees with a Razor tag helper fails the build.

## 9. Progressive enhancement, not a preference

Server-rendered consumers cannot assume JavaScript, and low-bandwidth users often do not get it. Every component works without script and enhances when it loads: native `<select>` before a custom listbox, `<details>` for disclosure, forms that submit on their own.

## 10. No build step, ever

Ship a plain stylesheet and a UMD bundle. Many PHP, WordPress and Razor projects have no bundler at all, and requiring one excludes exactly the teams this project exists to serve.

## 11. Simple is a product requirement

Fewer files, fewer dependencies, fewer abstractions, smaller public API. A component that needs a paragraph to explain its props is a design problem, not a documentation problem.

The test: a developer joining in six months should be able to read a component and know what it does, how to change it, and how it is styled — without a tour.

---

## Applying these

When two implementations both work, prefer the one with fewer moving parts. When a principle here conflicts with a specific requirement, the requirement wins — but say so in the commit message, because an undocumented exception becomes the new default.
