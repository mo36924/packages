import { transformSync } from "@babel/core";
import { expect, it } from "vitest";
import plugin, { Options } from "./index";

it("babel-plugin-jsx-display-name", () => {
  const result = transformSync("export default () => null", {
    filename: "src/components/A.jsx",
    plugins: [[plugin, { componentsDir: "src/components" } satisfies Options]],
  });

  expect(result).toMatchInlineSnapshot(`
    var A = () => null;
    export default A;
  `);
});
