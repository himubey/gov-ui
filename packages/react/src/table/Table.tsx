import type { ReactNode } from "react";
import { cx } from "../classes.js";

/*
 * Table.
 *
 * The semantics carry the weight here:
 *
 *   - <caption> tells a screen reader user what the table is of.
 *   - scope="col" associates each cell with its header. Without it a
 *     cell read in isolation is an unlabelled value.
 *   - aria-sort conveys sort state without relying on the arrow glyph.
 *   - The scroll container is focusable, so an overflowing table is
 *     reachable by keyboard. A scrolling region nothing can focus is a
 *     real WCAG 2.2 failure — invisible on a desktop, obvious on a phone.
 */

export type SortDirection = "ascending" | "descending" | "none";

export type Column<Row> = {
  key: keyof Row & string;
  header: ReactNode;
  /** Aligns to the end and uses tabular figures. */
  numeric?: boolean;
  /** Set to render the header as a sort link, and announce the state. */
  sort?: SortDirection;
  sortHref?: string;
};

export type TableProps<Row> = {
  columns: Column<Row>[];
  rows: Row[];
  /** Required. Visually hidden unless `captionVisible` is set. */
  caption: string;
  captionVisible?: boolean;
  className?: string;
};

export function Table<Row extends Record<string, unknown>>({
  columns,
  rows,
  caption,
  captionVisible,
  className,
}: TableProps<Row>) {
  return (
    <div
      className="gov-table-wrapper"
      // Focusable so the keyboard can reach and scroll it.
      tabIndex={0}
      role="region"
      aria-label={caption}
    >
      <table className={cx("gov-table", className)}>
        <caption className={cx("gov-table__caption", !captionVisible && "gov-visually-hidden")}>
          {caption}
        </caption>

        <thead className="gov-table__head">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cx("gov-table__header", column.numeric && "gov-table__header--numeric")}
                aria-sort={column.sort}
              >
                {column.sort ? (
                  // A real link, so sorting works with no JavaScript:
                  // a server-rendered table sorts by navigating.
                  <a className="gov-table__sort" href={column.sortHref || "#"}>
                    {column.header}
                  </a>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="gov-table__body">
          {rows.map((row, index) => (
            <tr key={index} className="gov-table__row">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cx(
                    "gov-table__cell",
                    column.numeric && "gov-table__cell--numeric",
                    column.numeric && "gov-tabular",
                  )}
                >
                  {row[column.key] as ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
