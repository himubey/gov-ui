/*
 * Navigation renderers: Breadcrumb and Pagination.
 *
 * Both are ordered lists inside a labelled <nav>. The list matters: it
 * tells a screen reader how many items there are before the user commits
 * to walking them. The label matters because a page has several nav
 * landmarks and "navigation" repeated four times helps nobody.
 */

import { el, classes } from "../render.mjs";
import { resolveClasses } from "../index.mjs";

/*
 * Breadcrumb.
 *
 * The current page is a <span>, not a link. A link that navigates to the
 * page you are already on is a small lie, and `aria-current="page"` is
 * how the current position is conveyed instead.
 */
export function renderBreadcrumb(manifest, props) {
  const items = props.items || [];

  const listItems = items.map((item, index) => {
    const isLast = index === items.length - 1;
    const current = item.current === undefined ? isLast : item.current;

    const content = current
      ? el("span", { class: manifest.classes.current, "aria-current": "page" }, item.label)
      : el("a", { class: manifest.classes.link, href: item.href }, item.label);

    return el("li", { class: manifest.classes.item }, content);
  });

  return el(
    "nav",
    {
      class: resolveClasses(manifest, props).join(" "),
      "aria-label": props.label || manifest.attributes["aria-label"],
    },
    el("ol", { class: manifest.classes.list }, listItems),
  );
}

/*
 * Pagination.
 *
 * Previous and Next are omitted at the ends rather than rendered
 * disabled. A disabled control still occupies the tab order in some
 * browsers and announces itself as something you might be able to use;
 * absence is unambiguous.
 *
 * Each number carries a visually hidden "Page" prefix, so a screen
 * reader announces "Page 2" instead of an unexplained "2".
 */
export function renderPagination(manifest, props) {
  const current = props.current || 1;
  const total = props.total || 1;
  const href = props.href || "?page=";

  const pageItems = [];
  for (let page = 1; page <= total; page++) {
    const isCurrent = page === current;
    pageItems.push(
      el(
        "li",
        { class: manifest.classes.item },
        el(
          "a",
          {
            class: classes(manifest.classes.link, isCurrent && manifest.classes.linkCurrent),
            href: href + page,
            "aria-current": isCurrent ? "page" : null,
          },
          [el("span", { class: "gov-visually-hidden" }, "Page "), String(page)],
        ),
      ),
    );
  }

  const previous =
    current > 1
      ? el(
          "a",
          {
            class: classes(manifest.classes.link, manifest.classes.linkPrevious),
            href: href + (current - 1),
            rel: "prev",
          },
          "Previous",
        )
      : null;

  const next =
    current < total
      ? el(
          "a",
          {
            class: classes(manifest.classes.link, manifest.classes.linkNext),
            href: href + (current + 1),
            rel: "next",
          },
          "Next",
        )
      : null;

  return el(
    "nav",
    {
      class: resolveClasses(manifest, props).join(" "),
      "aria-label": props.label || manifest.attributes["aria-label"],
    },
    [previous, el("ol", { class: manifest.classes.list }, pageItems), next],
  );
}
