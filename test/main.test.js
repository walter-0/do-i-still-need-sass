import { describe, it, expect, beforeEach } from "vitest";
import { JSDOM } from "jsdom";

const FILTER_ALL = "all";
const FILTER_NATIVE = "native";
const INLINE_FLEX_ITEMS_CENTER = ".inline-flex.items-center";
const TD_FIRST_CHILD_A = "td:first-child a";
const FEATURES_TABLE_TBODY_TR = "#features-table tbody tr";
const DISPLAY_NONE = "none";

/**
 * Creates a mock DOM environment for testing
 * @returns {{window: import("jsdom").DOMWindow, document: Document }} Mock DOM with window and document
 */
function createMockDOM() {
  const html = `
    <!DOCTYPE html>
    <html>
      <body>
        <input type="text" id="search-input" placeholder="Search features..." />

        <button class="filter-btn" data-filter="all">All</button>
        <button class="filter-btn" data-filter="native">Native</button>
        <button class="filter-btn" data-filter="partial">Partial</button>
        <button class="filter-btn" data-filter="none">No Equivalent</button>

        <table id="features-table">
          <tbody>
            <tr>
              <td>
                <a>Variables</a>
              </td>
              <td>
                <span class="inline-flex items-center gap-1.5">Native</span>
              </td>
            </tr>
            <tr>
              <td>
                <a>Nesting</a>
              </td>
              <td>
                <span class="inline-flex items-center gap-1.5">Native</span>
              </td>
            </tr>
            <tr>
              <td>
                <a>Operators</a>
              </td>
              <td>
                <span class="inline-flex items-center gap-1.5">Partial</span>
              </td>
            </tr>
            <tr>
              <td>
                <a>Functions</a>
              </td>
              <td>
                <span class="inline-flex items-center gap-1.5">Partial</span>
              </td>
            </tr>
            <tr>
              <td>
                <a>Mixins</a>
              </td>
              <td>
                <span class="inline-flex items-center gap-1.5">No Equivalent</span>
              </td>
            </tr>
            <tr>
              <td>
                <a>@extend</a>
              </td>
              <td>
                <span class="inline-flex items-center gap-1.5">No Equivalent</span>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  `;

  const dom = new JSDOM(html);
  return {
    document: dom.window.document,
    window: dom.window,
  };
}

/**
 * Gets the count of visible table rows
 * @param {Document} document - DOM document
 * @returns {number} Number of visible rows
 */
function getVisibleRowCount(document) {
  const rows = document.querySelectorAll(FEATURES_TABLE_TBODY_TR);
  return Array.from(rows).filter((row) => row.style.display !== DISPLAY_NONE).length;
}

describe("Search Functionality", () => {
  let document;
  let window;
  let searchInput;
  let tableRows;

  beforeEach(() => {
    const mockDOM = createMockDOM();
    document = mockDOM.document;
    window = mockDOM.window;
    global.document = document;

    searchInput = document.getElementById("search-input");
    tableRows = document.querySelectorAll(FEATURES_TABLE_TBODY_TR);

    // Simulate the search functionality from main.js
    const handleSearchInput = (e) => {
      const searchTerm = e.target.value.toLowerCase();
      tableRows.forEach((row) => {
        const featureName = row.querySelector(TD_FIRST_CHILD_A)?.textContent.toLowerCase() || "";
        if (featureName.includes(searchTerm)) {
          row.style.display = "";
        } else {
          row.style.display = DISPLAY_NONE;
        }
      });
    };

    searchInput.addEventListener("input", handleSearchInput);
  });

  it("should show all rows when search is empty", () => {
    searchInput.value = "";
    searchInput.dispatchEvent(new window.Event("input"));

    expect(getVisibleRowCount(document)).toBe(6);
  });

  it("should filter rows by search term 'var'", () => {
    searchInput.value = "var";
    searchInput.dispatchEvent(new window.Event("input"));

    expect(getVisibleRowCount(document)).toBe(1);
    const visibleRow = Array.from(tableRows).find((row) => row.style.display !== DISPLAY_NONE);
    expect(visibleRow?.querySelector("a")?.textContent).toBe("Variables");
  });

  it("should filter rows by search term 'nest'", () => {
    searchInput.value = "nest";
    searchInput.dispatchEvent(new window.Event("input"));

    expect(getVisibleRowCount(document)).toBe(1);
    const visibleRow = Array.from(tableRows).find((row) => row.style.display !== DISPLAY_NONE);
    expect(visibleRow?.querySelector("a")?.textContent).toBe("Nesting");
  });

  it("should show no rows for non-matching search term", () => {
    searchInput.value = "nonexistent";
    searchInput.dispatchEvent(new window.Event("input"));

    expect(getVisibleRowCount(document)).toBe(0);
  });

  it("should be case-insensitive", () => {
    searchInput.value = "MIXIN";
    searchInput.dispatchEvent(new window.Event("input"));

    expect(getVisibleRowCount(document)).toBe(1);
    const visibleRow = Array.from(tableRows).find((row) => row.style.display !== DISPLAY_NONE);
    expect(visibleRow?.querySelector("a")?.textContent).toBe("Mixins");
  });

  it("should support partial matching", () => {
    searchInput.value = "oper";
    searchInput.dispatchEvent(new window.Event("input"));

    expect(getVisibleRowCount(document)).toBe(1);
    const visibleRow = Array.from(tableRows).find((row) => row.style.display !== DISPLAY_NONE);
    expect(visibleRow?.querySelector("a")?.textContent).toBe("Operators");
  });
});

describe("Filter Functionality", () => {
  let document;
  let filterButtons;
  let tableRows;

  beforeEach(() => {
    const mockDOM = createMockDOM();
    document = mockDOM.document;
    global.document = document;

    filterButtons = document.querySelectorAll(".filter-btn");
    tableRows = document.querySelectorAll(FEATURES_TABLE_TBODY_TR);

    // Simulate the filter functionality from main.js
    const handleFilterClick = (button) => () => {
      const filter = button.dataset.filter;

      // Remove active class from all buttons
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      // Add active class to clicked button
      button.classList.add("active");

      // Apply filter
      tableRows.forEach((row) => {
        const statusBadge = row.querySelector(INLINE_FLEX_ITEMS_CENTER);
        const status = statusBadge?.textContent.trim().toLowerCase() || "";

        let normalizedStatus = "none";
        if (status.includes(FILTER_NATIVE)) normalizedStatus = FILTER_NATIVE;
        else if (status.includes("partial")) normalizedStatus = "partial";

        if (filter === FILTER_ALL || normalizedStatus === filter) {
          row.style.display = "";
        } else {
          row.style.display = DISPLAY_NONE;
        }
      });
    };

    filterButtons.forEach((button) => {
      button.addEventListener("click", handleFilterClick(button));
    });
  });

  it("should show all rows when 'All' filter is selected", () => {
    const allButton = Array.from(filterButtons).find((btn) => btn.dataset.filter === "all");
    allButton.click();

    expect(getVisibleRowCount(document)).toBe(6);
    expect(allButton.classList.contains("active")).toBe(true);
  });

  it("should show only native features when 'Native' filter is selected", () => {
    const nativeButton = Array.from(filterButtons).find((btn) => btn.dataset.filter === "native");
    nativeButton.click();

    expect(getVisibleRowCount(document)).toBe(2);
    expect(nativeButton.classList.contains("active")).toBe(true);

    const visibleRows = Array.from(tableRows).filter((row) => row.style.display !== DISPLAY_NONE);
    visibleRows.forEach((row) => {
      const status = row.querySelector(INLINE_FLEX_ITEMS_CENTER)?.textContent.toLowerCase();
      expect(status).toContain("native");
    });
  });

  it("should show only partial features when 'Partial' filter is selected", () => {
    const partialButton = Array.from(filterButtons).find((btn) => btn.dataset.filter === "partial");
    partialButton.click();

    expect(getVisibleRowCount(document)).toBe(2);
    expect(partialButton.classList.contains("active")).toBe(true);

    const visibleRows = Array.from(tableRows).filter((row) => row.style.display !== DISPLAY_NONE);
    visibleRows.forEach((row) => {
      const status = row.querySelector(INLINE_FLEX_ITEMS_CENTER)?.textContent.toLowerCase();
      expect(status).toContain("partial");
    });
  });

  it("should show only 'no equivalent' features when filter is selected", () => {
    const noneButton = Array.from(filterButtons).find((btn) => btn.dataset.filter === "none");
    noneButton.click();

    expect(getVisibleRowCount(document)).toBe(2);
    expect(noneButton.classList.contains("active")).toBe(true);

    const visibleRows = Array.from(tableRows).filter((row) => row.style.display !== DISPLAY_NONE);
    visibleRows.forEach((row) => {
      const status = row.querySelector(INLINE_FLEX_ITEMS_CENTER)?.textContent.toLowerCase();
      expect(status).toContain("no equivalent");
    });
  });

  it("should remove active class from previous button when new filter is selected", () => {
    const allButton = Array.from(filterButtons).find((btn) => btn.dataset.filter === "all");
    const nativeButton = Array.from(filterButtons).find((btn) => btn.dataset.filter === "native");

    allButton.click();
    expect(allButton.classList.contains("active")).toBe(true);

    nativeButton.click();
    expect(allButton.classList.contains("active")).toBe(false);
    expect(nativeButton.classList.contains("active")).toBe(true);
  });
});

describe("Combined Search and Filter", () => {
  let document;
  let window;
  let searchInput;
  let filterButtons;
  let tableRows;
  let currentFilter = FILTER_ALL;

  beforeEach(() => {
    const mockDOM = createMockDOM();
    document = mockDOM.document;
    window = mockDOM.window;
    global.document = document;

    searchInput = document.getElementById("search-input");
    filterButtons = document.querySelectorAll(".filter-btn");
    tableRows = document.querySelectorAll(FEATURES_TABLE_TBODY_TR);

    /**
     * Applies both search and filter to table rows
     */
    const applyFilters = () => {
      const searchTerm = searchInput.value.toLowerCase();

      tableRows.forEach((row) => {
        const featureName = row.querySelector(TD_FIRST_CHILD_A)?.textContent.toLowerCase() || "";
        const statusBadge = row.querySelector(INLINE_FLEX_ITEMS_CENTER);
        const status = statusBadge?.textContent.trim().toLowerCase() || "";

        let normalizedStatus = "none";
        if (status.includes(FILTER_NATIVE)) normalizedStatus = FILTER_NATIVE;
        else if (status.includes("partial")) normalizedStatus = "partial";

        const matchesSearch = featureName.includes(searchTerm);
        const matchesFilter = currentFilter === FILTER_ALL || normalizedStatus === currentFilter;

        if (matchesSearch && matchesFilter) {
          row.style.display = "";
        } else {
          row.style.display = DISPLAY_NONE;
        }
      });
    };

    // Setup search
    searchInput.addEventListener("input", applyFilters);

    // Setup filters
    const handleFilterClick = (button) => () => {
      currentFilter = button.dataset.filter;
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      applyFilters();
    };

    filterButtons.forEach((button) => {
      button.addEventListener("click", handleFilterClick(button));
    });
  });

  it("should combine search 'mix' with filter 'none'", () => {
    searchInput.value = "mix";
    searchInput.dispatchEvent(new window.Event("input"));

    const noneButton = Array.from(filterButtons).find((btn) => btn.dataset.filter === "none");
    noneButton.click();

    expect(getVisibleRowCount(document)).toBe(1);
    const visibleRow = Array.from(tableRows).find((row) => row.style.display !== DISPLAY_NONE);
    expect(visibleRow?.querySelector("a")?.textContent).toBe("Mixins");
  });

  it("should show no results when search and filter don't match", () => {
    searchInput.value = "mix";
    searchInput.dispatchEvent(new window.Event("input"));

    const nativeButton = Array.from(filterButtons).find((btn) => btn.dataset.filter === "native");
    nativeButton.click();

    expect(getVisibleRowCount(document)).toBe(0);
  });

  it("should update results when clearing search with active filter", () => {
    const nativeButton = Array.from(filterButtons).find((btn) => btn.dataset.filter === "native");
    nativeButton.click();

    searchInput.value = "var";
    searchInput.dispatchEvent(new window.Event("input"));
    expect(getVisibleRowCount(document)).toBe(1);

    searchInput.value = "";
    searchInput.dispatchEvent(new window.Event("input"));
    expect(getVisibleRowCount(document)).toBe(2); // All native features
  });
});
