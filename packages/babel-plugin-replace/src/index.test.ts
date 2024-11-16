import { transformSync } from "@babel/core";
import { expect, it } from "vitest";
import plugin, { Options } from "./index";

it("babel-plugin-replace", () => {
  const code = `
    const __DEV__ = false;
    if(__DEV__){
      console.log("__DEV__")
    }
    if(__PROD__){
      console.log("__PROD__")
    }
    if(import.meta.env.PROD){
      console.log("import.meta.env.PROD")
    }
    if(process.env.NODE_ENV){
      console.log("process.env.NODE_ENV")
    }
  `;

  const result = transformSync(code, {
    parserOpts: { plugins: ["jsx"] },
    plugins: [
      [
        plugin,
        {
          __DEV__: true,
          __PROD__: true,
          "import.meta.env.PROD": true,
          "process.env.NODE_ENV": JSON.stringify("production"),
        } satisfies Options,
      ],
    ],
  });

  expect(result).toMatchInlineSnapshot(`
    const __DEV__ = false;
    if (__DEV__) {
      console.log("__DEV__");
    }
    if (true) {
      console.log("__PROD__");
    }
    if (true) {
      console.log("import.meta.env.PROD");
    }
    if ("production") {
      console.log("process.env.NODE_ENV");
    }
  `);
});
