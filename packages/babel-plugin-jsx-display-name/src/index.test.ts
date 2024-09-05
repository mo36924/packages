import { transformSync } from "@babel/core";
import { expect, it } from "vitest";
import plugin, { Options } from "./index";

it("babel-plugin-jsx-display-name", () => {
  const result = transformSync("export default () => null", {
    filename: "src/components/A.jsx",
    plugins: [[plugin, { rootDir: "src/components" } satisfies Options]],
  });

  expect(result).toMatchInlineSnapshot(`
    export default function A() {
      return null;
    }
    A.displayName ??= "A";
  `);
});
