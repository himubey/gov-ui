/*
 * GOV UI — module registry and auto-initialization.
 *
 * This is the mechanism that lets a Django, Razor, PHP or WordPress
 * developer add one script tag and get working components, with no
 * bundler and no wiring code:
 *
 *   <script src="gov-ui.js" defer></script>
 *   <div class="gov-dialog" data-gov-module="dialog"> ... </div>
 *
 * Written in conservative ES5-era syntax on purpose. Government desktops
 * run old browsers, and this file ships untranspiled.
 *
 * Interaction behavior itself is added by component modules, each of
 * which calls GovUI.register(). None exist yet — the first arrive in the
 * v0.3 interaction milestone. Everything in v0.1 is plain semantic HTML
 * that needs no JavaScript at all.
 */

var modules = {};

/*
 * Register a component behavior.
 *
 * `init` receives the element and is called at most once per element per
 * module, however many times initialization runs.
 */
function register(name, init) {
  if (typeof name !== "string" || !name) {
    throw new Error("GovUI.register: name must be a non-empty string");
  }
  if (typeof init !== "function") {
    throw new Error("GovUI.register: init must be a function for module '" + name + "'");
  }
  modules[name] = init;
}

/* The set of modules already applied to an element, created on demand. */
function appliedTo(element) {
  if (!element.govUiApplied) {
    // A plain property rather than a data attribute: this is internal
    // bookkeeping and should not appear in the DOM, where it would show
    // up as a diff against the golden markup.
    Object.defineProperty(element, "govUiApplied", {
      value: {},
      enumerable: false,
      writable: false,
      configurable: true,
    });
  }
  return element.govUiApplied;
}

/*
 * Initialize every module found under `root`.
 *
 * Idempotent by design. Content-managed pages re-render fragments
 * constantly — WordPress, htmx, Turbo — and calling this again after a
 * swap must upgrade only what is new.
 */
function init(root) {
  var scope = root || document;
  var elements = scope.querySelectorAll("[data-gov-module]");

  for (var i = 0; i < elements.length; i++) {
    var element = elements[i];
    var names = (element.getAttribute("data-gov-module") || "").split(/\s+/);
    var applied = appliedTo(element);

    for (var j = 0; j < names.length; j++) {
      var name = names[j];
      if (!name || applied[name]) continue;

      var module = modules[name];
      if (!module) {
        // Not fatal. A page may include markup for a component whose
        // module was not shipped in this build; the component still
        // renders and stays usable, which is the whole point of
        // progressive enhancement.
        continue;
      }

      applied[name] = true;
      module(element);
    }
  }
}

/* Exposed for tests and for adapters that render markup after load. */
function registered() {
  return Object.keys(modules);
}

function reset() {
  modules = {};
}

var GovUI = {
  register: register,
  init: init,
  registered: registered,
  reset: reset,
  version: "0.0.0",
};

/*
 * Auto-initialize.
 *
 * `defer` on the script tag means DOMContentLoaded has usually not fired
 * yet, but check readyState so a late-injected script still works.
 */
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      init(document);
    });
  } else {
    init(document);
  }
}
