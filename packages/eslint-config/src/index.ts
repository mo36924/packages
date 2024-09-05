import antfu from "@antfu/eslint-config";
import stylistic from "@stylistic/eslint-plugin";
import noRelativeImportPaths from "eslint-plugin-no-relative-import-paths";

const factory: typeof antfu = (options, ...userConfigs) =>
  antfu(
    {
      stylistic: false,
      plugins: {
        style: stylistic,
        "no-relative-import-paths": noRelativeImportPaths,
      },
      rules: {
        curly: "error",
        "import/order": ["error", { alphabetize: { order: "asc" } }],
        "ts/consistent-type-definitions": ["error", "type"],
        "ts/consistent-type-imports": ["error", { prefer: "no-type-imports" }],
        "style/padding-line-between-statements": [
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
      },
      ...options,
    },
    ...userConfigs,
  );

export default factory;
