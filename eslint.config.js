import antfu from "@antfu/eslint-config";

export default antfu({
  stylistic: false,
  rules: {
    "ts/consistent-type-definitions": ["error", "type"],
    "ts/consistent-type-imports": ["error", { prefer: "no-type-imports" }],
  },
});
