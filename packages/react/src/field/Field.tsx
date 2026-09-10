import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";
import { cx, idFor } from "../classes.js";

/*
 * Input and Select.
 *
 * Both render label -> hint -> error -> control, with ids derived from
 * the field name so `for`, `aria-describedby` and any ErrorSummary link
 * always agree. Wiring these by hand is the single most common source of
 * accessibility defects in government forms, so the component owns it.
 *
 * The error message sits ABOVE the control: a screen reader user reaches
 * it before editing, and a mobile keyboard cannot cover it.
 */

type FieldBase = {
  /** Field name. Also the basis for the generated id. */
  name: string;
  label: ReactNode;
  hint?: ReactNode;
  /** Presence of this switches the field into its error state. */
  error?: ReactNode;
  id?: string;
};

function useFieldParts(props: FieldBase) {
  const id = props.id || idFor(props.name);
  const hintId = props.hint ? `${id}-hint` : null;
  const errorId = props.error ? `${id}-error` : null;

  // Order matters to a screen reader: hint before error.
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return { id, hintId, errorId, describedBy };
}

function FieldChrome({
  id,
  hintId,
  errorId,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  hintId: string | null;
  errorId: string | null;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={cx("gov-field", Boolean(error) && "gov-field--error")}>
      <label className="gov-field__label" htmlFor={id}>
        {label}
      </label>

      {hint ? (
        <p className="gov-field__hint" id={hintId ?? undefined}>
          {hint}
        </p>
      ) : null}

      {error ? (
        <p className="gov-field__error" id={errorId ?? undefined}>
          {/* Announced, not shown. Without it the message is a sentence
              with no indication that it is an error, and the meaning
              rests entirely on the red text. */}
          <span className="gov-visually-hidden">Error:</span> {error}
        </p>
      ) : null}

      {children}
    </div>
  );
}

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "id"> & FieldBase;

export function Input({ name, label, hint, error, id, className, type = "text", ...props }: InputProps) {
  const parts = useFieldParts({ name, label, hint, error, id });

  return (
    <FieldChrome {...parts} label={label} hint={hint} error={error}>
      <input
        className={cx("gov-input", Boolean(error) && "gov-input--error", className)}
        id={parts.id}
        name={name}
        type={type}
        aria-describedby={parts.describedBy}
        // Only when there is an error. Present-and-false on every field
        // is noise, and some screen readers announce it.
        aria-invalid={error ? true : undefined}
        {...props}
      />
    </FieldChrome>
  );
}

export type SelectOption = { value: string; label: string };

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "name" | "id"> &
  FieldBase & { options: SelectOption[] };

export function Select({ name, label, hint, error, id, className, options, ...props }: SelectProps) {
  const parts = useFieldParts({ name, label, hint, error, id });

  return (
    <FieldChrome {...parts} label={label} hint={hint} error={error}>
      {/* A native select: the only listbox that is correct on every
          browser, screen reader and mobile platform without JavaScript. */}
      <select
        className={cx("gov-select", Boolean(error) && "gov-select--error", className)}
        id={parts.id}
        name={name}
        aria-describedby={parts.describedBy}
        aria-invalid={error ? true : undefined}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldChrome>
  );
}
