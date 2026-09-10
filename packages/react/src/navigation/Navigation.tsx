import { cx } from "../classes.js";

/*
 * Breadcrumb and Pagination.
 *
 * Both are ordered lists inside a labelled <nav>. The list tells a
 * screen reader how many items there are before the user walks them;
 * the label distinguishes this landmark from the page's others.
 */

export type BreadcrumbItem = {
  label: string;
  href?: string;
  /** Defaults to true for the last item. */
  current?: boolean;
};

export type BreadcrumbProps = {
  items: BreadcrumbItem[];
  label?: string;
  className?: string;
};

export function Breadcrumb({ items, label = "Breadcrumb", className }: BreadcrumbProps) {
  return (
    <nav className={cx("gov-breadcrumb", className)} aria-label={label}>
      <ol className="gov-breadcrumb__list">
        {items.map((item, index) => {
          const isCurrent = item.current === undefined ? index === items.length - 1 : item.current;

          return (
            <li key={index} className="gov-breadcrumb__item">
              {isCurrent ? (
                // A span, not a link. A link that navigates to the page
                // you are already on is a small lie; aria-current is how
                // the position is conveyed.
                <span className="gov-breadcrumb__current" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <a className="gov-breadcrumb__link" href={item.href}>
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export type PaginationProps = {
  current: number;
  total: number;
  /** Page number is appended. Real hrefs keep pages shareable. */
  href?: string;
  label?: string;
  className?: string;
};

export function Pagination({
  current,
  total,
  href = "?page=",
  label = "Pagination",
  className,
}: PaginationProps) {
  const pages = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <nav className={cx("gov-pagination", className)} aria-label={label}>
      {/* Omitted at the ends rather than rendered disabled: a disabled
          control still announces itself as something you might be able
          to use, whereas absence is unambiguous. */}
      {current > 1 ? (
        <a
          className="gov-pagination__link gov-pagination__link--previous"
          href={href + (current - 1)}
          rel="prev"
        >
          Previous
        </a>
      ) : null}

      <ol className="gov-pagination__list">
        {pages.map((page) => {
          const isCurrent = page === current;
          return (
            <li key={page} className="gov-pagination__item">
              <a
                className={cx("gov-pagination__link", isCurrent && "gov-pagination__link--current")}
                href={href + page}
                aria-current={isCurrent ? "page" : undefined}
              >
                {/* So it announces as "Page 2" rather than "2". */}
                <span className="gov-visually-hidden">Page </span>
                {page}
              </a>
            </li>
          );
        })}
      </ol>

      {current < total ? (
        <a
          className="gov-pagination__link gov-pagination__link--next"
          href={href + (current + 1)}
          rel="next"
        >
          Next
        </a>
      ) : null}
    </nav>
  );
}
