module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "script",
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
  ignorePatterns: ["node_modules/", "dist/", "gh-pages/", ".github/"],
};
