import { transformSync } from "@babel/core";
import { expect, it } from "vitest";
import plugin, { Options } from "./index";

it("babel-plugin-server-function-use-client", () => {
  const code = `
    import { readFileSync } from "fs";

    const serverFunction = async () => {
      "use server";
      const data = await readFileSync("test.txt", "utf-8");
      return data;
    }

    async function serverFunction1(){
      "use server";
      const result = await Promise.resolve(0);
      return result;
    }

    export const result = await Promise.all([serverFunction(), serverFunction1()]);
  `;

  let result = transformSync(code, { filename: "/index.js", plugins: [[plugin, {} satisfies Options]] });

  expect(result).toMatchInlineSnapshot(`
    const _2f696e6465782e6a73_1 = _runtime("_2f696e6465782e6a73_1");
    const _2f696e6465782e6a73_0 = _runtime("_2f696e6465782e6a73_0");
    import _runtime from "@mo36924/babel-plugin-server-function/runtime";
    const serverFunction = _2f696e6465782e6a73_0;
    export const result = await Promise.all([serverFunction(), _2f696e6465782e6a73_1()]);
  `);

  result = transformSync(code, {
    filename: "/index.js",
    plugins: [[plugin, { serverFunctionIds: [] } satisfies Options]],
  });

  expect(result).toMatchInlineSnapshot(`
    const _2f696e6465782e6a73_1 = _runtime("EXfhzWjFLhitZcmWlSTDSaStAOWBqElbLlbrPkPCxmXCs");
    const _2f696e6465782e6a73_0 = _runtime("btQZTjkHBzOaWBkGnwEdPtLKnTdFZGtiBXFOjsQmXOARm");
    import _runtime from "@mo36924/babel-plugin-server-function/runtime";
    const serverFunction = _2f696e6465782e6a73_0;
    export const result = await Promise.all([serverFunction(), _2f696e6465782e6a73_1()]);
  `);
});
