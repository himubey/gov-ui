import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "../classes.js";

/*
 * Layout: Page, PageHeader, Toolbar, and StatusBadge.
 *
 * Deliberately thin. These add structure, not behavior.
 */

export type PageProps = HTMLAttributes<HTMLDivElement>;

/** Constrains page content to a readable width. */
export function Page({ className, ...props }: PageProps) {
  return <div className={cx("gov-page", className)} {...props} />;
}

export type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Primary actions, rendered beside the title. */
  children?: ReactNode;
  /** Defaults to h1. Change only when this genuinely is not the page title. */
  headingLevel?: "h1" | "h2" | "h3";
  className?: string;
};

export function PageHeader({
  title,
  description,
  children,
  headingLevel: Heading = "h1",
  className,
}: PageHeaderProps) {
  return (
    <header className={cx("gov-page-header", className)}>
      <div className="gov-page-header__content">
        {/* One h1 per page, and this is it. Two h1 elements, or a skip
            from h1 to h3, breaks the outline screen reader users
            navigate by. */}
        <Heading className="gov-page-header__title">{title}</Heading>
        {description ? <p className="gov-page-header__description">{description}</p> : null}
      </div>

      {/* Actions live outside the heading, so the heading text is
          exactly the page name. */}
      {children ? <div className="gov-page-header__actions">{children}</div> : null}
    </header>
  );
}

export type ToolbarProps = HTMLAttributes<HTMLElement> & {
  /**
   * Render as a form so filters submit without JavaScript.
   *
   * Worth doing wherever the toolbar actually filters something: it is
   * what makes the controls work for a user whose script never loaded.
   */
  as?: "div" | "form";
  method?: string;
  action?: string;
};

/**
 * Groups search, filters and actions above a table.
 *
 * Deliberately not `role="toolbar"`, which would impose arrow-key
 * navigation and take Tab away from the controls inside — the wrong
 * model for a row of filters and a search box.
 */
export function Toolbar({ as: Element = "div", className, ...props }: ToolbarProps) {
  return <Element className={cx("gov-toolbar", className)} {...props} />;
}

export type StatusBadgeProps = {
  status?: "success" | "warning" | "danger" | "info" | "neutral";
  /** Required. The label is the status; color only reinforces it. */
  children: ReactNode;
  className?: string;
};

export function StatusBadge({ status = "neutral", children, className }: StatusBadgeProps) {
  return (
    <span className={cx("gov-status", `gov-status--${status}`, className)}>{children}</span>
  );
}
