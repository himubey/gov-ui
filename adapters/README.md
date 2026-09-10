# Adapters

Framework adapters for GOV UI. Empty for now — these land in the adapter phase, once the core is proven.

## The one rule

**Adapters emit markup. Nothing else.**

No styles. No behavior. No logic. An adapter is a set of templates that produce the markup declared in `packages/manifest/components/`, plus a static-asset drop for `gov-ui.css` and `gov-ui.js`.

Anything else in an adapter is a bug. Behavior belongs in `packages/core`, styles in `packages/css`. If an adapter needs something those two do not provide, the gap is in the core, and that is where it gets fixed — otherwise five copies of a subtly different dialog appear, which is the failure mode this structure exists to prevent.

This is what keeps five ecosystems maintainable by a small team: adding a component means adding one template per adapter. Mechanical work, not architectural work.

## Conformance

Every adapter is checked against the golden markup in `fixtures/` on DOM equivalence — attribute order, class order and whitespace may differ; nothing else may.

Adapters that cannot run under Node — Razor, Blade, Twig — render their output to a file in CI, and that file is fed through the same comparison.

```bash
npm run check:conformance
```

A Django template tag that disagrees with a Razor tag helper fails the build. That is the point.

## Planned

| Directory | Ecosystem | Channel | Tier |
|---|---|---|---|
| `dotnet/` | ASP.NET Razor tag helpers | NuGet | 2 |
| `django/` | Django template tags | PyPI | 2 |
| `php/` | Laravel Blade, Symfony Twig | Packagist | 2 |
| `wordpress/` | Plugin + pattern library | WordPress.org | 3 |

**Django goes first.** Its form layer already carries everything `ErrorSummary` needs — field errors, labels, and the ids to link them to — so wiring it once makes every Django government form audit-passing by default. That is the most valuable single integration in the set.

**WordPress goes last, and stays Tier 3.** It is the least aligned: WordPress is a content platform, while GOV UI targets admin forms and records. Start with asset enqueueing and a copy-paste pattern library. Build Gutenberg blocks only if a real user asks — not speculatively.
