/*
 * Layout renderers: PageHeader.
 *
 * Page and Toolbar need no bespoke renderer — they are single elements
 * wrapping their children, so the fallback in index.mjs handles them.
 * Adding renderers for them would be code that does nothing.
 */

import { el } from "../render.mjs";
import { resolveClasses } from "../index.mjs";

/*
 * PageHeader.
 *
 * The heading level is configurable but defaults to h1, because a page
 * has exactly one h1 and this is it. Anything that puts two h1 elements
 * on a page, or skips from h1 to h3, breaks the document outline that
 * screen reader users navigate by.
 *
 * Actions sit in their own container rather than inside the heading, so
 * the heading text is exactly the page name — a heading that reads
 * "Employees Export Add Employee" is not a useful landmark.
 */
export function renderPageHeader(manifest, props) {
  const heading = el(
    props.headingLevel || "h1",
    { class: manifest.classes.title },
    props.title,
  );

  const description = props.description
    ? el("p", { class: manifest.classes.description }, props.description)
    : null;

  const content = el("div", { class: manifest.classes.content }, [heading, description]);

  const actions = props.children
    ? el("div", { class: manifest.classes.actions }, props.children)
    : null;

  return el("header", { class: resolveClasses(manifest, props).join(" ") }, [content, actions]);
}
