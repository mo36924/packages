import { transformSync } from "@babel/core";
import { expect, it } from "vitest";
import plugin, { Options } from "./index";

it("babel-plugin-inject", () => {
  const code = `
    console.log(A);
    console.log(A);
    console.log(B);
    console.log(C);
    const d = <D />
    const e = <D />
  `;

  const result = transformSync(code, {
    filename: "/a/a.js",
    parserOpts: { plugins: ["jsx"] },
    plugins: [
      [plugin, { A: ["@A", "default"], B: ["@B", "B"], C: ["/c/c.js", "C"], D: ["@D", "D"] } satisfies Options],
    ],
  });

  expect(result).toMatchInlineSnapshot(`
    import { D } from "@D";
    import { C } from "../c/c.js";
    import { B } from "@B";
    import { default as A } from "@A";
    console.log(A);
    console.log(A);
    console.log(B);
    console.log(C);
    const d = <D />;
    const e = <D />;
  `);
});
