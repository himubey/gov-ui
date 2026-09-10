import type { ButtonHTMLAttributes } from "react";
import { cx } from "../classes.js";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md";
};

/**
 * Use Button for actions. For navigation use a link, so that
 * middle-click, right-click and browser history behave as expected.
 */
export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      // Keep the native button element so browser keyboard behavior and
      // form participation stay predictable.
      //
      // type defaults to button, not submit, so a button placed inside a
      // form does not submit it by accident.
      type={type}
      className={cx("gov-button", `gov-button--${variant}`, `gov-button--${size}`, className)}
      {...props}
    />
  );
}
