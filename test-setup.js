/**
 * Test setup file for Vitest
 * Configures the testing environment before tests run
 */

// Mock CSS imports since Vitest doesn't process them
import { vi } from "vitest";

// Mock Prism.js
vi.mock("prismjs", () => ({
  default: {
    highlightAll: vi.fn(),
    highlightElement: vi.fn(),
  },
}));

// Mock Prism CSS imports
vi.mock("prismjs/themes/prism-tomorrow.css", () => ({}));
vi.mock("prismjs/components/prism-scss", () => ({}));
vi.mock("prismjs/components/prism-css", () => ({}));

// Mock style.css import
vi.mock("./style.css", () => ({}));
