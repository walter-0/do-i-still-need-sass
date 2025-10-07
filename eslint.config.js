import js from "@eslint/js";
import jsdoc from "eslint-plugin-jsdoc";
import sonarjs from "eslint-plugin-sonarjs";
import importPlugin from "eslint-plugin-import";
import vitest from "@vitest/eslint-plugin";

export default [
  js.configs.recommended,
  jsdoc.configs["flat/recommended-typescript-flavor"],
  sonarjs.configs.recommended,
  importPlugin.flatConfigs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // Node.js globals
        console: "readonly",
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        // Browser globals for potential client-side code
        window: "readonly",
        document: "readonly",
      },
    },
    plugins: {
      jsdoc,
    },
    rules: {
      // Code quality
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      "no-debugger": "error",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "prefer-const": "error",
      "no-var": "error",

      // JSDoc rules
      "jsdoc/require-jsdoc": [
        "warn",
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: false,
            FunctionExpression: false,
          },
        },
      ],
      "jsdoc/require-description": "warn",
      "jsdoc/require-param-description": "warn",
      "jsdoc/require-returns-description": "warn",
      "jsdoc/no-undefined-types": "off", // Allow custom types defined in typedefs.js

      // SonarJS rules - complexity and bug detection
      "sonarjs/cognitive-complexity": ["warn", 15],
      "sonarjs/no-duplicate-string": ["warn", { threshold: 3 }],
      "sonarjs/no-nested-functions": "warn",
    },
  },
  {
    // Ignore build output and dependencies
    ignores: ["dist/", "node_modules/"],
  },
  {
    files: ["**/*.test.js"],
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
      "sonarjs/no-nested-functions": "off",
    },
  },
];
