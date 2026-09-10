/*
 * React as an emitter.
 *
 * This is the test the whole architecture exists for. React renders each
 * component with the same props as the golden fixtures and must produce
 * equivalent DOM. If a class name, an ARIA attribute or an element ever
 * drifts between the reference markup and the React implementation, this
 * fails — which is the safety net that makes writing the behavior twice
 * safe rather than reckless.
 *
 * When the adapters land, each one is added here the same way.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { loadManifests, isEquivalent, normalizeHtml } from "../packages/manifest/index.mjs";
import { casesFor, readGolden, uncoveredVariants } from "../scripts/conformance.mjs";
import * as GovUI from "../packages/react/dist/index.js";

const manifests = loadManifests();

/*
 * Map a manifest's prop shape onto the React component's props.
 *
 * The two differ deliberately: the manifest describes markup and so
 * carries an `attributes` bag, while React components take native props
 * directly. This adapter is the seam, and keeping it small is a good
 * signal that the two APIs have not diverged.
 */
const COMPONENTS = {
  button: (props) =>
    createElement(GovUI.Button, { ...props.attributes, variant: props.variant, size: props.size }, props.children),

  input: (props) =>
    createElement(GovUI.Input, {
      name: props.name,
      label: props.label,
      hint: props.hint,
      error: props.error,
      type: props.type,
      placeholder: props.placeholder,
      disabled: props.disabled,
      // defaultValue rather than value: a value without onChange makes
      // React warn about an uncontrolled-to-controlled input, and the
      // rendered markup is identical.
      defaultValue: props.value,
    }),

  select: (props) =>
    createElement(GovUI.Select, {
      name: props.name,
      label: props.label,
      hint: props.hint,
      error: props.error,
      options: props.options,
      defaultValue: props.value,
    }),

  "status-badge": (props) =>
    createElement(GovUI.StatusBadge, { status: props.status }, props.children),

  breadcrumb: (props) => createElement(GovUI.Breadcrumb, { items: props.items }),

  pagination: (props) =>
    createElement(GovUI.Pagination, { current: props.current, total: props.total }),

  table: (props) =>
    createElement(GovUI.Table, {
      columns: props.columns,
      rows: props.rows.map(renderCells),
      caption: props.caption,
      captionVisible: props.captionVisible,
    }),

  page: (props) => createElement(GovUI.Page, null, props.children),

  "page-header": (props) =>
    createElement(
      GovUI.PageHeader,
      { title: props.title, description: props.description },
      renderChildren(props.children),
    ),

  toolbar: (props) => createElement(GovUI.Toolbar, null, renderChildren(props.children)),
};

/* Turn `{component, props}` descriptors into React elements. */
function renderChildren(children) {
  if (children === undefined || children === null) return null;
  if (Array.isArray(children)) {
    // A keyed Fragment, not a wrapper element: anything else would
    // inject markup that is not in the contract.
    return children.map((child, index) =>
      createElement(Fragment, { key: index }, renderChildren(child)),
    );
  }
  if (children && typeof children === "object" && children.component) {
    return COMPONENTS[children.component](children.props || {});
  }
  return children;
}

/* Table cells may themselves be component descriptors. */
function renderCells(row) {
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] =
      value && typeof value === "object" && value.component
        ? COMPONENTS[value.component](value.props || {})
        : value;
  }
  return out;
}

describe("React emitter conformance", () => {
  for (const [name, manifest] of Object.entries(manifests)) {
    describe(name, () => {
      const golden = readGolden(name);

      for (const testCase of casesFor(manifest)) {
        test(testCase.name + " matches the golden markup", () => {
          const expected = golden[testCase.name];
          assert.ok(expected, "no golden case named " + testCase.name);

          const actual = renderToStaticMarkup(COMPONENTS[name](testCase.props));

          assert.ok(
            isEquivalent(actual, expected),
            "React output diverged from the markup contract\n" +
              "  expected: " + normalizeHtml(expected) + "\n" +
              "  actual:   " + normalizeHtml(actual),
          );
        });
      }
    });
  }

  test("every component has a React implementation", () => {
    const missing = Object.keys(manifests).filter((name) => !COMPONENTS[name]);
    assert.deepEqual(missing, [], "components declared but not implemented in React");
  });

  test("every declared variant value appears in an example", () => {
    // Otherwise the variant ships with no golden markup and no emitter
    // is ever checked against it.
    const missing = Object.values(manifests).flatMap(uncoveredVariants);
    assert.deepEqual(missing, [], "variant values with no example: " + missing.join(", "));
  });
});
