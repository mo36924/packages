import { transformSync } from "@babel/core";
import { expect, test } from "vitest";
import plugin from "./index";

test("babel-plugin-transform-export-default-name", () => {
  const result = transformSync("export default () => 0", { filename: "index.ts", plugins: [plugin] });

  expect(result).toMatchInlineSnapshot(`
    const Index = () => 0;
    export default Index;
  `);
});
