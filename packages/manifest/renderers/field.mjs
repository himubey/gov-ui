/*
 * Field renderers: Input and Select.
 *
 * Both share one structure, because the accessibility wiring is the part
 * that matters and it is identical:
 *
 *   label -> hint -> error -> control
 *
 * The error message sits ABOVE the control, not below it. A screen
 * reader user tabbing into the field hears the label, then the hint,
 * then the error, then edits — which is the order they need it in. It
 * also stays visible when a mobile keyboard covers the lower half of the
 * screen.
 *
 * ids are derived from the field name so that `for`, `aria-describedby`
 * and the ErrorSummary's target link all agree without the caller having
 * to wire them by hand. Getting this wrong is the single most common
 * accessibility defect in government forms.
 */

import { el, idFor, classes } from "../render.mjs";
import { resolveClasses } from "../index.mjs";

function fieldParts(manifest, props) {
  const id = props.id || idFor(props.name || manifest.name);
  const hintId = props.hint ? id + "-hint" : null;
  const errorId = props.error ? id + "-error" : null;

  // Order matters to a screen reader: hint before error.
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || null;

  const label = el(
    "label",
    { class: manifest.classes.label, for: id },
    props.label,
  );

  const hint = props.hint
    ? el("p", { class: manifest.classes.hint, id: hintId }, props.hint)
    : null;

  const error = props.error
    ? el("p", { class: manifest.classes.error, id: errorId }, [
        // Announced to screen readers, invisible on screen: without it
        // the message is just a sentence with no indication it is an
        // error. Meaning must not rest on the red text alone.
        el("span", { class: "gov-visually-hidden" }, "Error:"),
        " " + props.error,
      ])
    : null;

  return { id, describedBy, label, hint, error };
}

export function renderInput(manifest, props) {
  const { id, describedBy, label, hint, error } = fieldParts(manifest, props);

  const control = el("input", {
    class: classes(...resolveClasses(manifest, props), props.error && manifest.classes.invalid),
    id,
    name: props.name || id,
    type: props.type || "text",
    value: props.value,
    placeholder: props.placeholder,
    disabled: props.disabled,
    readonly: props.readOnly,
    required: props.required,
    "aria-describedby": describedBy,
    // Only present when there is an error. aria-invalid="false" on every
    // field is noise, and some screen readers announce it.
    "aria-invalid": props.error ? "true" : null,
  });

  return el(
    "div",
    { class: classes(manifest.classes.wrapper, props.error && manifest.classes.wrapperInvalid) },
    [label, hint, error, control],
  );
}

export function renderSelect(manifest, props) {
  const { id, describedBy, label, hint, error } = fieldParts(manifest, props);

  const options = (props.options || []).map((option) =>
    el(
      "option",
      { value: option.value, selected: option.value === props.value },
      option.label,
    ),
  );

  const control = el(
    "select",
    {
      class: classes(...resolveClasses(manifest, props), props.error && manifest.classes.invalid),
      id,
      name: props.name || id,
      disabled: props.disabled,
      required: props.required,
      "aria-describedby": describedBy,
      "aria-invalid": props.error ? "true" : null,
    },
    options,
  );

  return el(
    "div",
    { class: classes(manifest.classes.wrapper, props.error && manifest.classes.wrapperInvalid) },
    [label, hint, error, control],
  );
}
