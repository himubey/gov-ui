/*
 * GOV UI — React components.
 *
 * Two rules apply to everything exported here:
 *
 * 1. Components render the markup declared in @gov-ui/manifest, verified
 *    against the golden fixtures by the conformance suite. React is one
 *    emitter among several; it is not the definition of correct markup.
 *
 * 2. Behavior is reimplemented against the shared ARIA and keyboard
 *    contract — it does not wrap @gov-ui/core. Imperative DOM code
 *    behind React refs fights hydration and server rendering, which is
 *    the failure this separation avoids. See CLAUDE.md section 24.
 *
 * Zero runtime dependencies. React is a peer.
 *
 * Styles come from @gov-ui/css, which is shared with every other
 * emitter, so component styles are not co-located here.
 */

export { Button } from "./button/Button.js";
export type { ButtonProps } from "./button/Button.js";

export { Input, Select } from "./field/Field.js";
export type { InputProps, SelectProps, SelectOption } from "./field/Field.js";

export { Table } from "./table/Table.js";
export type { TableProps, Column, SortDirection } from "./table/Table.js";

export { Breadcrumb, Pagination } from "./navigation/Navigation.js";
export type { BreadcrumbProps, BreadcrumbItem, PaginationProps } from "./navigation/Navigation.js";

export { Page, PageHeader, Toolbar, StatusBadge } from "./layout/Layout.js";
export type {
  PageProps,
  PageHeaderProps,
  ToolbarProps,
  StatusBadgeProps,
} from "./layout/Layout.js";

export { cx } from "./classes.js";
