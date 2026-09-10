/*
 * Sidebar filter.
 *
 * Progressive enhancement, and the reason the search field is marked
 * hidden in the markup: it is revealed only once this script runs. A
 * search box that is present but silently does nothing is worse than no
 * search box at all.
 *
 * Filtering happens over the navigation that is already on the page, so
 * there is no index to build, nothing to fetch, and it works offline —
 * which matters on the locked-down networks this system targets.
 *
 * No dependencies, no framework, no build step. Same rules as the
 * library itself.
 */

(function () {
  "use strict";

  var search = document.querySelector("[data-docs-search]");
  if (!search) return;

  var input = search.querySelector("input");
  var status = search.querySelector("[data-docs-search-status]");
  var links = Array.prototype.slice.call(document.querySelectorAll(".docs-nav__link"));

  // Only now is the control real, so only now is it shown.
  search.hidden = false;

  function filter() {
    var query = input.value.trim().toLowerCase();
    var visible = 0;

    links.forEach(function (link) {
      var item = link.parentNode;
      var matches = !query || link.textContent.toLowerCase().indexOf(query) !== -1;

      // `hidden` rather than a style change, so the entry leaves the
      // accessibility tree too and is not read out by a screen reader
      // while being invisible on screen.
      item.hidden = !matches;
      if (matches) visible++;
    });

    // Hide a group heading whose items have all been filtered away.
    Array.prototype.forEach.call(document.querySelectorAll(".docs-nav__group"), function (group) {
      var shown = group.querySelectorAll(".docs-nav__list > li:not([hidden])").length;
      group.hidden = shown === 0;
    });

    if (status) {
      // aria-live on this element announces the count as the user types,
      // so a screen reader user knows the list changed under them.
      status.textContent = query
        ? visible + (visible === 1 ? " page matches" : " pages match")
        : "";
    }
  }

  input.addEventListener("input", filter);

  // Escape clears, which is the behavior people expect from a filter and
  // costs one line.
  input.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && input.value) {
      input.value = "";
      filter();
    }
  });
})();
