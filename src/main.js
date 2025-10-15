import "./style.css";
import "./types.ts";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-scss";
import "prismjs/components/prism-css";
import { initCalculator } from "./calculator-ui.js";

/**
 * Initializes search and filter functionality for the features table.
 */
function initializeFilters() {
  const searchInput = document.getElementById("search-input");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const tableRows = document.querySelectorAll("#features-table tbody tr");

  let currentFilter = "all";
  let currentSearch = "";

  /**
   * Filters table rows based on current search and filter state.
   */
  function applyFilters() {
    tableRows.forEach((row) => {
      const featureName = row.querySelector("td:first-child a")?.textContent.toLowerCase() || "";
      const statusBadge = row.querySelector(".inline-flex.items-center.gap-1\\.5");
      const status = statusBadge?.textContent.trim().toLowerCase() || "";

      // Normalize status text to match filter values
      let normalizedStatus = "none";
      if (status.includes("native")) normalizedStatus = "native";
      else if (status.includes("partial")) normalizedStatus = "partial";

      // Check if row matches filters
      const matchesSearch = featureName.includes(currentSearch);
      const matchesFilter = currentFilter === "all" || normalizedStatus === currentFilter;

      // Show or hide row
      if (matchesSearch && matchesFilter) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });

    updateResultsCount();
  }

  /**
   * Updates the visible results count display.
   */
  function updateResultsCount() {
    const visibleRows = Array.from(tableRows).filter((row) => row.style.display !== "none");
    const totalRows = tableRows.length;

    // Create or update results count element
    let resultsCount = document.getElementById("results-count");
    if (!resultsCount) {
      resultsCount = document.createElement("div");
      resultsCount.id = "results-count";
      resultsCount.className = "text-sm text-zinc-400 mb-2";
      const tableContainer = document.querySelector(".rounded-2xl.border");
      tableContainer?.insertAdjacentElement("beforebegin", resultsCount);
    }

    if (currentFilter !== "all" || currentSearch !== "") {
      resultsCount.textContent = `Showing ${visibleRows.length} of ${totalRows} features`;
      resultsCount.style.display = "block";
    } else {
      resultsCount.style.display = "none";
    }
  }

  // Search input handler
  searchInput?.addEventListener("input", (e) => {
    currentSearch = e.target.value.toLowerCase();
    applyFilters();
  });

  // Filter button handlers
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active state from all buttons
      filterButtons.forEach((btn) => btn.classList.remove("active"));

      // Add active state to clicked button
      button.classList.add("active");

      // Update current filter
      currentFilter = button.dataset.filter;

      applyFilters();
    });
  });
}

/**
 * Initializes syntax highlighting for code examples.
 */
function initializeSyntaxHighlighting() {
  // Highlight all code blocks on initial load
  Prism.highlightAll();

  // Re-highlight when details elements are opened
  document.addEventListener(
    "toggle",
    (e) => {
      if (e.target.matches("details.code-example-details") && e.target.open) {
        // Highlight code blocks inside the opened details element
        const codeBlocks = e.target.querySelectorAll("pre code");
        codeBlocks.forEach((block) => {
          Prism.highlightElement(block);
        });
      }
    },
    true,
  );
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initializeFilters();
    initializeSyntaxHighlighting();
    initCalculator();
  });
} else {
  initializeFilters();
  initializeSyntaxHighlighting();
  initCalculator();
}
