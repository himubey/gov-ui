/*
 * Reference renderers.
 *
 * One entry per component that needs markup more complex than a single
 * element wrapping its children. Components absent from this map fall
 * back to the generic single-element renderer in index.mjs — Button,
 * Page, Toolbar and StatusBadge all do, and adding renderers for them
 * would be code that does nothing.
 *
 * These renderers define correct markup. Adapters are not required to
 * share this code — a Razor tag helper obviously cannot — only to
 * produce output that normalizes to the same DOM.
 */

import { renderInput, renderSelect } from "./field.mjs";
import { renderBreadcrumb, renderPagination } from "./navigation.mjs";
import { renderTable } from "./table.mjs";
import { renderPageHeader } from "./layout.mjs";

export const renderers = {
  input: renderInput,
  select: renderSelect,
  breadcrumb: renderBreadcrumb,
  pagination: renderPagination,
  table: renderTable,
  "page-header": renderPageHeader,
};
