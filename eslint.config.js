import typescript from "@typescript-eslint/eslint-plugin";
import parser from "@typescript-eslint/parser";
import _import from "eslint-plugin-import";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  {
    files: ["**/*.ts", "**/*.js"],
    ignores: ["**/dist/*"],
    languageOptions: { parser },
    plugins: { "@typescript-eslint": typescript, import: _import },
    rules: {
      "@typescript-eslint/padding-line-between-statements": [
        "error",
        {
          blankLine: "always",
          prev: "*",
          next: [
            "import",
            "export",
            "class",
            "function",
            "block",
            "block-like",
            "multiline-expression",
            "multiline-const",
            "multiline-let",
          ],
        },
        {
          blankLine: "always",
          prev: [
            "import",
            "export",
            "class",
            "function",
            "block",
            "block-like",
            "multiline-expression",
            "multiline-const",
            "multiline-let",
          ],
          next: "*",
        },
        { blankLine: "never", prev: "import", next: "import" },
        { blankLine: "never", prev: "*", next: ["case", "default"] },
        { blankLine: "never", prev: ["case", "default"], next: "*" },
      ],
      "sort-imports": ["warn", { ignoreDeclarationSort: true }],
      "import/order": ["warn", { alphabetize: { order: "asc" } }],
    },
  },
];
