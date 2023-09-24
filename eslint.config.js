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
        "warn",
        {
          blankLine: "always",
          prev: ["block", "block-like", "class", "export", "import"],
          next: "*",
        },
        { blankLine: "any", prev: ["export", "import"], next: ["export", "import"] },
      ],
      "sort-imports": ["warn", { ignoreDeclarationSort: true }],
      "import/order": ["warn", { alphabetize: { order: "asc" } }],
    },
  },
];
