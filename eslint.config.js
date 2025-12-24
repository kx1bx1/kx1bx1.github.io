import js from "@eslint/js";

export default [
  // Base recommended rules
  js.configs.recommended,

  // Project-specific config
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        alert: "readonly",
      },
    },

    rules: {
      // Safety
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-undef": "error",
      "no-redeclare": "error",

      // Style (non-annoying)
      eqeqeq: ["error", "always"],
      curly: ["error", "multi-line"],
      "no-var": "error",
      "prefer-const": "error",

      // Allow common DOM patterns
      "no-alert": "off",
      "no-console": "off",
    },
  },

  // Ignore patterns
  {
    ignores: ["node_modules/**", "dist/**", "gh-pages/**", ".github/**"],
  },
];
