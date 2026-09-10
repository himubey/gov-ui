/*
 * Table.
 *
 * The flagship pattern for administrative software, and the one that
 * most rewards getting the semantics right.
 *
 * Three things that are easy to skip and expensive to retrofit:
 *
 *   - `<caption>`. A screen reader user landing on a table asks "what is
 *     this a table of". Visually hidden by default, because sighted
 *     users already have the page heading.
 *   - `scope="col"`. Without it, a cell read in isolation has no header
 *     association, and the row becomes a list of unlabelled values.
 *   - Tabular figures on numeric columns, so digits align down the
 *     column. The difference between a scannable ID column and a ragged
 *     one is one class.
 *
 * Sorting is expressed with `aria-sort` on the header and a real link or
 * button inside it, so it works without JavaScript: a server-rendered
 * table sorts by navigating. That is the whole reason the sort control
 * is a link rather than a click handler.
 */

import { el, classes, raw } from "../render.mjs";
import { resolveClasses } from "../index.mjs";

/*
 * A cell value may be a plain value or a nested component descriptor,
 * so a StatusBadge can live inside a cell without the table knowing
 * anything about badges.
 */
function cellContent(value, render) {
  if (value && typeof value === "object" && value.component) {
    return raw(render(value.component, value.props || {}));
  }
  return value === null || value === undefined ? "" : String(value);
}

export function renderTable(manifest, props, render) {
  const columns = props.columns || [];
  const rows = props.rows || [];

  const headerCells = columns.map((column) => {
    const sortState = column.sort || null;

    const label = sortState
      ? el(
          "a",
          {
            class: manifest.classes.sort,
            href: column.sortHref || "#",
          },
          column.header,
        )
      : column.header;

    return el(
      "th",
      {
        scope: "col",
        class: classes(manifest.classes.header, column.numeric && manifest.classes.headerNumeric),
        // none / ascending / descending — announced by screen readers and
        // the only thing that conveys sort state without color.
        "aria-sort": sortState,
      },
      label,
    );
  });

  const bodyRows = rows.map((row) =>
    el(
      "tr",
      { class: manifest.classes.row },
      columns.map((column) =>
        el(
          "td",
          {
            class: classes(
              manifest.classes.cell,
              column.numeric && manifest.classes.cellNumeric,
              column.numeric && "gov-tabular",
            ),
          },
          cellContent(row[column.key], render),
        ),
      ),
    ),
  );

  const caption = props.caption
    ? el(
        "caption",
        { class: classes(manifest.classes.caption, !props.captionVisible && "gov-visually-hidden") },
        props.caption,
      )
    : null;

  const table = el("table", { class: resolveClasses(manifest, props).join(" ") }, [
    caption,
    el("thead", { class: manifest.classes.head }, el("tr", null, headerCells)),
    el("tbody", { class: manifest.classes.body }, bodyRows),
  ]);

  /*
   * The scroll container is focusable and labelled.
   *
   * A table that scrolls horizontally is unreachable by keyboard unless
   * something in it can take focus — a real WCAG 2.2 failure that is
   * invisible on a desktop and obvious on a phone. tabindex="0" on the
   * wrapper is the standard remedy.
   */
  return el(
    "div",
    {
      class: manifest.classes.wrapper,
      tabindex: "0",
      role: "region",
      "aria-label": props.caption || null,
    },
    table,
  );
}
