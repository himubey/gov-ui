/*
 * Documentation site generator.
 *
 * Static HTML. No framework, no bundler, no build step for the reader —
 * the same constraints the library places on its consumers, applied to
 * its own documentation. A design system whose docs need a toolchain the
 * system itself refuses to require is arguing against its own case.
 *
 * Every component page is generated from the markup contract and the
 * golden fixtures, so the documentation cannot show markup that has not
 * shipped. The live examples on each page are literally the golden
 * strings the conformance suite checks every emitter against.
 *
 *   node apps/docs/build.mjs      ->  apps/docs/dist/
 */

import { writeFileSync, mkdirSync, copyFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadManifests } from "../../packages/manifest/index.mjs";
import { readGolden } from "../../scripts/conformance.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const OUT = join(here, "dist");

const SITE = {
  name: "GOV UI",
  tagline: "Lightweight UI for government software.",
  version: "v0.1 (pre-release)",
};

/* ---------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------- */

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);

function titleCase(name) {
  return name.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
}

/* Pretty-print the golden markup so the code panels are readable. */
function formatHtml(html) {
  const VOID = /^<(input|img|br|hr|meta|link)\b/;
  let depth = 0;
  return String(html)
    .replace(/></g, ">\n<")
    .split("\n")
    .map((line) => {
      if (/^<\//.test(line)) depth = Math.max(0, depth - 1);
      const indented = "  ".repeat(depth) + line;
      const opens = /^<[a-zA-Z]/.test(line) && !VOID.test(line) && !/<\/[a-zA-Z][\w-]*>$/.test(line);
      if (opens) depth++;
      return indented;
    })
    .join("\n");
}

function codeBlock(code, label, standalone) {
  return [
    label ? `<div class="docs-example__label">${escape(label)}</div>` : "",
    `<pre class="docs-code${standalone ? " docs-code--standalone" : ""}"><code>${escape(code)}</code></pre>`,
  ].join("\n");
}

/* ---------------------------------------------------------------
 * Navigation
 * ------------------------------------------------------------- */

function navigation(manifests, currentHref) {
  const groups = [
    {
      heading: "Getting started",
      items: [
        { href: "index.html", label: "Overview" },
        { href: "install.html", label: "Install" },
        { href: "theming.html", label: "Theming" },
        { href: "accessibility.html", label: "Accessibility" },
      ],
    },
    {
      heading: "Components",
      items: Object.keys(manifests).map((name) => ({
        href: name + ".html",
        label: titleCase(name),
      })),
    },
  ];

  return groups
    .map(
      (group) => `
      <div class="docs-nav__group">
        <h2 class="docs-nav__heading" id="nav-${escape(group.heading.replace(/\s+/g, "-").toLowerCase())}">${escape(group.heading)}</h2>
        <ul class="docs-nav__list">
          ${group.items
            .map(
              (item) => `<li><a class="docs-nav__link" href="${item.href}"${
                item.href === currentHref ? ' aria-current="page"' : ""
              }>${escape(item.label)}</a></li>`,
            )
            .join("\n          ")}
        </ul>
      </div>`,
    )
    .join("\n");
}

/* ---------------------------------------------------------------
 * Page shell
 * ------------------------------------------------------------- */

function layout({ title, href, manifests, content }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)} — ${escape(SITE.name)}</title>
<meta name="description" content="${escape(SITE.tagline)}">
<link rel="stylesheet" href="gov-ui.css">
<link rel="stylesheet" href="docs.css">
</head>
<body>

<!-- First focusable element on the page, so a keyboard user can get
     past the navigation without tabbing through every link. -->
<a class="gov-visually-hidden" href="#main">Skip to main content</a>

<header class="docs-header">
  <div class="docs-header__inner">
    <a class="docs-header__name" href="index.html">${escape(SITE.name)}</a>
    <span class="docs-header__tagline">${escape(SITE.tagline)}</span>
  </div>
</header>

<nav class="docs-versions" aria-label="Version">
  <div class="docs-versions__inner">
    <a class="docs-versions__item" href="index.html" aria-current="page">${escape(SITE.version)}</a>
  </div>
</nav>

<div class="docs-layout">
  <div class="docs-sidebar">
    <!-- Revealed by search.js. Hidden until then, because a search box
         that does nothing is worse than none. -->
    <form class="docs-search" data-docs-search hidden onsubmit="return false">
      <div class="gov-field">
        <label class="gov-field__label" for="docs-search">Search documentation</label>
        <input class="gov-input" id="docs-search" name="q" type="search" autocomplete="off">
      </div>
      <p class="docs-search__status" data-docs-search-status role="status" aria-live="polite"></p>
    </form>

    <nav aria-label="Documentation">
      ${navigation(manifests, href)}
    </nav>
  </div>

  <main class="docs-content" id="main">
${content}
  </main>
</div>

<footer class="docs-footer">
  <div class="docs-footer__inner">
    <ul class="docs-footer__links">
      <li><a href="accessibility.html">Accessibility</a></li>
      <li><a href="install.html">Install</a></li>
      <li><a href="https://github.com/">GitHub</a></li>
    </ul>
    <p class="docs-footer__note">
      MIT licensed. <strong>Not affiliated with, or endorsed by, any government.</strong>
      GOV UI ships no state emblem, seal or other official insignia, and adopting it
      does not certify a service against any accessibility standard.
    </p>
  </div>
</footer>

<script src="search.js" defer></script>
</body>
</html>
`;
}

/* ---------------------------------------------------------------
 * Component pages
 * ------------------------------------------------------------- */

function componentPage(name, manifest, golden) {
  const docs = manifest.docs || {};
  const a11y = manifest.a11y || {};
  const out = [];

  out.push(`    <h1>${escape(titleCase(name))}</h1>`);
  if (docs.summary) out.push(`    <p>${escape(docs.summary)}</p>`);

  if (docs.whenToUse?.length || docs.whenNotToUse?.length) {
    out.push("    <h2>When to use it</h2>");
    if (docs.whenToUse?.length) {
      out.push("    <ul>");
      for (const item of docs.whenToUse) out.push(`      <li>${escape(item)}</li>`);
      out.push("    </ul>");
    }
    if (docs.whenNotToUse?.length) {
      out.push("    <h3>When not to use it</h3>");
      out.push("    <ul>");
      for (const item of docs.whenNotToUse) out.push(`      <li>${escape(item)}</li>`);
      out.push("    </ul>");
    }
  }

  out.push("    <h2>Examples</h2>");
  out.push(
    `    <p>Each example is a conformance case: every emitter — React, and each framework
    adapter — is checked against exactly this markup.</p>`,
  );

  for (const [caseName, props] of Object.entries(manifest.examples)) {
    const markup = golden?.[caseName];
    if (!markup) continue;

    out.push(`    <h3>${escape(caseName)}</h3>`);
    out.push('    <div class="docs-example">');
    out.push('      <div class="docs-example__label">Rendered</div>');

    /*
     * A specimen containing a heading goes in an iframe.
     *
     * PageHeader renders the page's h1. Dropping that straight into this
     * document gives the page four h1 elements and a broken outline —
     * a real defect for anyone navigating by headings, and one that gets
     * worse with every example.
     *
     * Demoting the heading in the preview would be the easy fix and the
     * wrong one: the whole point of these panels is that they show the
     * markup that actually ships. An iframe is what the specimen really
     * is — a separate document with its own outline.
     */
    if (/<h[1-6][\s>]/.test(markup)) {
      const doc = `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
        `<link rel="stylesheet" href="gov-ui.css"></head><body>${markup}</body></html>`;
      out.push(
        `      <iframe class="docs-example__frame" title="Live example: ${escape(name)} ${escape(caseName)}" ` +
          `srcdoc="${escape(doc)}"></iframe>`,
      );
    } else {
      // Generated by this repo from the manifest, so there is no
      // untrusted input in this string.
      out.push(`      <div class="docs-example__preview">${markup}</div>`);
    }

    out.push(codeBlock(formatHtml(markup), "HTML"));
    out.push("    </div>");
    out.push(codeBlock(JSON.stringify(props, null, 2), null, true));
  }

  if (manifest.variants && Object.keys(manifest.variants).length) {
    out.push("    <h2>Variants</h2>");
    out.push('    <div class="gov-table-wrapper" tabindex="0" role="region" aria-label="Variants">');
    out.push('      <table class="gov-table">');
    out.push('        <caption class="gov-table__caption gov-visually-hidden">Variants</caption>');
    out.push('        <thead class="gov-table__head"><tr>');
    out.push('          <th scope="col" class="gov-table__header">Prop</th>');
    out.push('          <th scope="col" class="gov-table__header">Values</th>');
    out.push('          <th scope="col" class="gov-table__header">Default</th>');
    out.push("        </tr></thead>");
    out.push('        <tbody class="gov-table__body">');
    for (const [key, values] of Object.entries(manifest.variants)) {
      const fallback = (manifest.defaults || {})[key];
      out.push(
        `          <tr class="gov-table__row"><td class="gov-table__cell"><code>${escape(key)}</code></td>` +
          `<td class="gov-table__cell">${values.map((v) => `<code>${escape(v)}</code>`).join(", ")}</td>` +
          `<td class="gov-table__cell">${fallback ? `<code>${escape(fallback)}</code>` : "—"}</td></tr>`,
      );
    }
    out.push("        </tbody></table></div>");
  }

  out.push("    <h2>Accessibility</h2>");
  if (a11y.accessibleName) {
    out.push(`    <p><strong>Accessible name.</strong> ${escape(a11y.accessibleName)}</p>`);
  }
  if (a11y.keyboard && Object.keys(a11y.keyboard).length) {
    out.push('    <div class="gov-table-wrapper" tabindex="0" role="region" aria-label="Keyboard">');
    out.push('      <table class="gov-table">');
    out.push('        <caption class="gov-table__caption gov-visually-hidden">Keyboard behavior</caption>');
    out.push('        <thead class="gov-table__head"><tr>');
    out.push('          <th scope="col" class="gov-table__header">Key</th>');
    out.push('          <th scope="col" class="gov-table__header">Behavior</th>');
    out.push("        </tr></thead>");
    out.push('        <tbody class="gov-table__body">');
    for (const [key, behavior] of Object.entries(a11y.keyboard)) {
      out.push(
        `          <tr class="gov-table__row"><td class="gov-table__cell"><kbd>${escape(key)}</kbd></td>` +
          `<td class="gov-table__cell">${escape(behavior)}</td></tr>`,
      );
    }
    out.push("        </tbody></table></div>");
  }
  if (a11y.notes?.length) {
    out.push("    <ul>");
    for (const note of a11y.notes) out.push(`      <li>${escape(note)}</li>`);
    out.push("    </ul>");
  }

  out.push("    <h2>Class names</h2>");
  out.push('    <div class="gov-table-wrapper" tabindex="0" role="region" aria-label="Class names">');
  out.push('      <table class="gov-table">');
  out.push('        <caption class="gov-table__caption gov-visually-hidden">Class names</caption>');
  out.push('        <thead class="gov-table__head"><tr>');
  out.push('          <th scope="col" class="gov-table__header">Role</th>');
  out.push('          <th scope="col" class="gov-table__header">Class</th>');
  out.push("        </tr></thead>");
  out.push('        <tbody class="gov-table__body">');
  for (const [role, value] of Object.entries(manifest.classes)) {
    out.push(
      `          <tr class="gov-table__row"><td class="gov-table__cell"><code>${escape(role)}</code></td>` +
        `<td class="gov-table__cell"><code>.${escape(value)}</code></td></tr>`,
    );
  }
  out.push("        </tbody></table></div>");

  out.push(
    `    <p><a href="https://github.com/">View the manifest</a> for this component:
    <code>packages/manifest/components/${escape(name)}.json</code></p>`,
  );

  return out.join("\n");
}

/* ---------------------------------------------------------------
 * Content pages
 * ------------------------------------------------------------- */

const overview = `    <h1>${escape(SITE.name)}</h1>

    <p>${escape(SITE.name)} provides the components developers need to build clean, consistent
    and accessible public-sector applications — admin tools, records systems, caseworker
    interfaces and the forms that feed them.</p>

    <div class="docs-note">
      <p><strong>Pre-release.</strong> The v0.1 component set is complete and verified, but the
      public API may still change. Not yet published to a package registry.</p>
    </div>

    <h2>What makes it different</h2>

    <p><strong>It works everywhere, not just in React.</strong> Most public-sector software runs
    on ASP.NET, Django, PHP and WordPress. Shipping working components only to React consumers
    hands everyone else a stylesheet with no dialog that opens — so the framework-free layer is
    the product, and React is one consumer of it.</p>

    <p><strong>Zero runtime dependencies.</strong> No headless primitive library. All interaction
    behavior is written and owned here, which is what lets it exist for every stack — and means
    nothing external stands between a reported accessibility bug and its fix.</p>

    <p><strong>One markup contract, mechanically enforced.</strong> Every component's markup is
    declared once, and every emitter is checked against it in CI. Community ports of other design
    systems drift because nothing verifies that a Django tag and a Razor tag helper still agree.
    Here, something does.</p>

    <p><strong>Accessibility with evidence.</strong> WCAG 2.2 AA, with a contrast gate that
    measures the tokens that actually ship rather than a claim in a readme.</p>

    <h2>Why not GOV.UK Design System or USWDS</h2>

    <p>Those systems are mature and well audited. Where they fit, use them.</p>

    <p>They are built for <strong>citizen-facing transactional services</strong>: one question per
    page, large type, low density. That is right for someone applying for a licence once a year,
    and wrong for a caseworker processing four hundred records a day. Governments that adopt them
    for their public sites still hand-roll their internal admin interfaces.</p>

    <p>GOV UI fills that gap, and is complementary rather than competing.</p>

    <h2>Start here</h2>

    <ul>
      <li><a href="install.html">Install</a> — for HTML, React, .NET, Django, PHP or WordPress</li>
      <li><a href="theming.html">Theming</a> — change the primary color without touching components</li>
      <li><a href="accessibility.html">Accessibility</a> — the conformance target and what is tested</li>
      <li><a href="button.html">Components</a> — the v0.1 set</li>
    </ul>`;

const install = `    <h1>Install</h1>

    <p>GOV UI ships a plain stylesheet and a UMD script. Neither requires a bundler, because
    many of the projects this system targets do not have one.</p>

    <h2>Plain HTML</h2>

    <p>The primary path. Two tags, no build step:</p>

${codeBlock(
  `<link rel="stylesheet" href="gov-ui.css">
<script src="gov-ui.js" defer></script>

<button class="gov-button gov-button--primary gov-button--md" type="button">Save</button>`,
  null,
  true,
)}

    <p>Components initialize themselves from <code>data-gov-module</code> attributes. There is no
    wiring code to write.</p>

    <div class="docs-note">
      <p>Every v0.1 component is plain semantic HTML and needs no JavaScript at all. The script
      matters from v0.3, when the interactive components land.</p>
    </div>

    <h2>React</h2>

${codeBlock(`npm install @gov-ui/react @gov-ui/css`, null, true)}

${codeBlock(
  `import { Button } from "@gov-ui/react";

export function SaveAction() {
  return <Button>Save</Button>;
}`,
  null,
  true,
)}

    <h2>Server-rendered frameworks</h2>

    <p>Adapters emit exactly the markup in the plain-HTML example. They carry no styles and no
    behavior of their own — anything else in an adapter is a bug.</p>

${codeBlock(
  `<!-- .NET Razor -->
<gov-button variant="primary">Save</gov-button>

<!-- Django -->
{% gov_button variant="primary" %}Save{% endgov_button %}

<!-- Laravel Blade -->
<x-gov-button variant="primary">Save</x-gov-button>`,
  null,
  true,
)}

    <div class="docs-note">
      <p>The adapters are not built yet. They land after the interaction milestone, so they have
      a stable contract to conform to. Django goes first.</p>
    </div>

    <h2>Support tiers</h2>

    <p>Published so expectations are honest. Five ecosystems is real maintenance surface, and
    implying that all of them get equal attention would be a promise this project cannot keep.</p>

    <div class="gov-table-wrapper" tabindex="0" role="region" aria-label="Support tiers">
      <table class="gov-table">
        <caption class="gov-table__caption gov-visually-hidden">Support tiers</caption>
        <thead class="gov-table__head">
          <tr>
            <th scope="col" class="gov-table__header">Tier</th>
            <th scope="col" class="gov-table__header">What</th>
            <th scope="col" class="gov-table__header">Channel</th>
          </tr>
        </thead>
        <tbody class="gov-table__body">
          <tr class="gov-table__row"><td class="gov-table__cell">1 — core</td><td class="gov-table__cell"><code>gov-ui.css</code> + <code>gov-ui.js</code></td><td class="gov-table__cell">CDN, zip, npm</td></tr>
          <tr class="gov-table__row"><td class="gov-table__cell">1 — core</td><td class="gov-table__cell"><code>@gov-ui/react</code></td><td class="gov-table__cell">npm</td></tr>
          <tr class="gov-table__row"><td class="gov-table__cell">2 — adapter</td><td class="gov-table__cell">.NET Razor tag helpers</td><td class="gov-table__cell">NuGet</td></tr>
          <tr class="gov-table__row"><td class="gov-table__cell">2 — adapter</td><td class="gov-table__cell">Django template tags</td><td class="gov-table__cell">PyPI</td></tr>
          <tr class="gov-table__row"><td class="gov-table__cell">2 — adapter</td><td class="gov-table__cell">Laravel Blade, Symfony Twig</td><td class="gov-table__cell">Packagist</td></tr>
          <tr class="gov-table__row"><td class="gov-table__cell">3 — documented</td><td class="gov-table__cell">WordPress plugin</td><td class="gov-table__cell">WordPress.org</td></tr>
        </tbody>
      </table>
    </div>`;

const theming = `    <h1>Theming</h1>

    <p>A department changes the theme by overriding custom properties. No component code changes,
    and no recompile — unlike systems that theme at Sass compile time, one build can serve many
    departments.</p>

${codeBlock(
  `:root {
  --gov-primary: #005ea8;
  --gov-primary-hover: #004f8f;
}`,
  null,
  true,
)}

    <p>Components consume semantic tokens and never repeat raw values, so they do not care which
    blue is selected.</p>

    <h2>Density</h2>

    <p>Administrative software is read all day. Density is a mode set once on a container, never a
    prop threaded through every component:</p>

${codeBlock(`<div data-gov-density="compact"> ... </div>`, null, true)}

    <h2>Two tokens that are easy to get wrong</h2>

    <h3>Focus is not derived from the primary color</h3>

    <p>A navy focus ring on a navy primary button is invisible. Yellow alone does not solve it
    either — <code>#ffdd00</code> is about 1.1:1 against a white page. The ring is two-tone: a
    yellow band inside a dark one, so whichever surface it lands on, one of its edges carries the
    contrast.</p>

    <p>If you re-theme <code>--gov-focus</code>, check it against every surface it can land on,
    including your primary button.</p>

    <h3>There are two border tokens</h3>

    <p>A decorative table rule and the edge of a text input have different jobs. WCAG 2.2 requires
    3:1 for the latter (SC 1.4.11) and nothing for the former.</p>

    <div class="gov-table-wrapper" tabindex="0" role="region" aria-label="Border tokens">
      <table class="gov-table">
        <caption class="gov-table__caption gov-visually-hidden">Border tokens</caption>
        <thead class="gov-table__head">
          <tr>
            <th scope="col" class="gov-table__header">Token</th>
            <th scope="col" class="gov-table__header">Use</th>
          </tr>
        </thead>
        <tbody class="gov-table__body">
          <tr class="gov-table__row"><td class="gov-table__cell"><code>--gov-border</code></td><td class="gov-table__cell">Decoration: table rules, dividers, card edges</td></tr>
          <tr class="gov-table__row"><td class="gov-table__cell"><code>--gov-border-strong</code></td><td class="gov-table__cell">Interactive control edges: inputs, secondary buttons</td></tr>
        </tbody>
      </table>
    </div>

    <p>Collapsing them into one light grey is among the most common ways a design system quietly
    fails that criterion.</p>

    <h2>Internationalization</h2>

    <p>Two defaults that feel neutral and are not:</p>

    <ul>
      <li><strong>Line-height is floored at 1.4.</strong> Devanagari matras sit above and below the
      baseline and clip at the ~1.2 heading line-height most design systems use. Bengali, Tamil and
      Gurmukhi behave the same way.</li>
      <li><strong>Only logical CSS properties are used</strong> — <code>padding-inline</code>,
      <code>border-inline-start</code> — so components mirror correctly under
      <code>dir="rtl"</code> without a second set of rules.</li>
    </ul>`;

const accessibility = `    <h1>Accessibility</h1>

    <p>A general claim of accessibility is worthless in procurement. GOV UI states a target and
    publishes evidence against it.</p>

    <div class="docs-note">
      <p><strong>Scope.</strong> GOV UI supports conformance at the <em>component</em> level. It
      cannot certify an application. A team building on it still owns its own content, information
      architecture, server-side validation and end-to-end testing.</p>
    </div>

    <h2>Target</h2>

    <div class="gov-table-wrapper" tabindex="0" role="region" aria-label="Accessibility commitments">
      <table class="gov-table">
        <caption class="gov-table__caption gov-visually-hidden">Commitments</caption>
        <thead class="gov-table__head">
          <tr>
            <th scope="col" class="gov-table__header">Commitment</th>
            <th scope="col" class="gov-table__header">Detail</th>
          </tr>
        </thead>
        <tbody class="gov-table__body">
          <tr class="gov-table__row"><td class="gov-table__cell">Standard</td><td class="gov-table__cell">WCAG 2.2 Level AA</td></tr>
          <tr class="gov-table__row"><td class="gov-table__cell">Evidence</td><td class="gov-table__cell">VPAT 2.5 ACR per minor release</td></tr>
          <tr class="gov-table__row"><td class="gov-table__cell">India</td><td class="gov-table__cell">GIGW 3.0 conformance mapping, certified by STQC</td></tr>
          <tr class="gov-table__row"><td class="gov-table__cell">Automated</td><td class="gov-table__cell">Contrast and markup gates in CI</td></tr>
          <tr class="gov-table__row"><td class="gov-table__cell">Manual</td><td class="gov-table__cell">NVDA, JAWS and VoiceOver matrix per interactive component</td></tr>
          <tr class="gov-table__row"><td class="gov-table__cell">High contrast</td><td class="gov-table__cell"><code>forced-colors: active</code> supported</td></tr>
        </tbody>
      </table>
    </div>

    <p>Automated tooling catches roughly a third of real accessibility defects. The manual matrix
    is not optional, and is part of a component's definition of done.</p>

    <h2>What runs on every change</h2>

    <ul>
      <li><strong>Contrast.</strong> Every color pair the system depends on is measured from the
      tokens that ship — 24 pairs, including text on each surface, control edges, status badges
      and both edges of the focus ring.</li>
      <li><strong>Conformance.</strong> Every emitter produces the agreed markup, so ARIA and
      semantics cannot drift per framework.</li>
      <li><strong>Budget.</strong> Payload stays within a gzipped limit, because performance is an
      accessibility issue on a low-end device.</li>
    </ul>

    <div class="docs-note">
      <p><strong>Not yet automated.</strong> Browser-level checks — axe, forced-colors, 200% zoom
      and RTL rendering — are not in CI yet. Everything verified today is static analysis and DOM
      comparison, which is genuinely useful but is not the same as testing rendered output.</p>
    </div>

    <h2>Reporting a problem</h2>

    <p>Accessibility defects are treated as correctness bugs, not enhancements. Report the
    component, the assistive technology and version, and what you expected.</p>`;

/* ---------------------------------------------------------------
 * Build
 * ------------------------------------------------------------- */

const manifests = loadManifests();
mkdirSync(OUT, { recursive: true });

const pages = [
  { href: "index.html", title: "Overview", content: overview },
  { href: "install.html", title: "Install", content: install },
  { href: "theming.html", title: "Theming", content: theming },
  { href: "accessibility.html", title: "Accessibility", content: accessibility },
];

for (const page of pages) {
  writeFileSync(join(OUT, page.href), layout({ ...page, manifests }));
}

for (const [name, manifest] of Object.entries(manifests)) {
  writeFileSync(
    join(OUT, name + ".html"),
    layout({
      title: titleCase(name),
      href: name + ".html",
      manifests,
      content: componentPage(name, manifest, readGolden(name)),
    }),
  );
}

// The site links the built assets directly, the same way a consumer does.
copyFileSync(join(root, "packages/css/dist/gov-ui.css"), join(OUT, "gov-ui.css"));
copyFileSync(join(root, "packages/core/dist/gov-ui.js"), join(OUT, "gov-ui.js"));
copyFileSync(join(here, "docs.css"), join(OUT, "docs.css"));
copyFileSync(join(here, "search.js"), join(OUT, "search.js"));

const total = pages.length + Object.keys(manifests).length;
console.log("docs site: " + total + " page(s) written to apps/docs/dist/");
