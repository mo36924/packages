import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { transformSync } from "@babel/core";
import { describe, expect, it } from "vitest";
import plugin, { Options } from "./index";

const code = `
  import { readFile } from "fs/promises";

  const serverFunction = async () => {
    "use server";
    const data = await readFile("test.txt", "utf-8");
    return data;
  }

  async function serverFunction1(){
    "use server";
    const data = await readFile("test1.txt", "utf-8");
    return data;
  }

  export default async () => {
    const data = await serverFunction();
    const data1 = await serverFunction1();

    return [data, data1]
  };
`;

describe("babel-plugin-server-function", () => {
  it("client-development", () => {
    const result = transformSync(code, { filename: "/index.js", plugins: [[plugin, {} satisfies Options]] });

    expect(result).toMatchInlineSnapshot(`
      const _2f696e6465782e6a73_1 = _runtime("_2f696e6465782e6a73_1");
      const _2f696e6465782e6a73_0 = _runtime("_2f696e6465782e6a73_0");
      import _runtime from "@mo36924/babel-plugin-server-function/runtime";
      const serverFunction = _2f696e6465782e6a73_0;
      export default async () => {
        const data = await serverFunction();
        const data1 = await _2f696e6465782e6a73_1();
        return [data, data1];
      };
    `);
  });

  it("server-development", () => {
    const result = transformSync(code, {
      filename: "/index.js",
      plugins: [[plugin, { server: true } satisfies Options]],
    });

    expect(result).toMatchInlineSnapshot(`
      import { readFile } from "fs/promises";
      const serverFunction = _2f696e6465782e6a73_0;
      export default async () => {
        const data = await serverFunction();
        const data1 = await _2f696e6465782e6a73_1();
        return [data, data1];
      };
      export async function _2f696e6465782e6a73_0() {
        const data = await readFile("test.txt", "utf-8");
        return data;
      }
      export async function _2f696e6465782e6a73_1() {
        const data = await readFile("test1.txt", "utf-8");
        return data;
      }
    `);
  });

  it("client-production", () => {
    const result = transformSync(code, {
      filename: "/index.js",
      plugins: [[plugin, { serverFunctionIds: [] } satisfies Options]],
    });

    expect(result).toMatchInlineSnapshot(`
      const _2f696e6465782e6a73_1 = _runtime("EXfhzWjFLhitZcmWlSTDSaStAOWBqElbLlbrPkPCxmXCs");
      const _2f696e6465782e6a73_0 = _runtime("btQZTjkHBzOaWBkGnwEdPtLKnTdFZGtiBXFOjsQmXOARm");
      import _runtime from "@mo36924/babel-plugin-server-function/runtime";
      const serverFunction = _2f696e6465782e6a73_0;
      export default async () => {
        const data = await serverFunction();
        const data1 = await _2f696e6465782e6a73_1();
        return [data, data1];
      };
    `);
  });

  it("server-production", () => {
    const result = transformSync(code, {
      filename: "/index.js",
      plugins: [[plugin, { server: true, serverFunctionIds: [] } satisfies Options]],
    });

    expect(result).toMatchInlineSnapshot(`
      import { readFile } from "fs/promises";
      const serverFunction = _2f696e6465782e6a73_0;
      export default async () => {
        const data = await serverFunction();
        const data1 = await _2f696e6465782e6a73_1();
        return [data, data1];
      };
      export async function _2f696e6465782e6a73_0() {
        const data = await readFile("test.txt", "utf-8");
        return data;
      }
      export async function _2f696e6465782e6a73_1() {
        const data = await readFile("test1.txt", "utf-8");
        return data;
      }
    `);
  });

  it("fetch-production", () => {
    const fetchPath = join(fileURLToPath(import.meta.url), "..", "fetch.js");

    const result = transformSync("", {
      filename: fetchPath,
      plugins: [
        [
          plugin,
          { server: true, serverFunctionIds: ["_2f696e6465782e6a73_0", "_2f696e6465782e6a73_1"] } satisfies Options,
        ],
      ],
    });

    expect(result).toMatchInlineSnapshot(`
      import { _2f696e6465782e6a73_0 } from "/index.js";
      import { _2f696e6465782e6a73_1 } from "/index.js";
      const serverFunctions = {
        btQZTjkHBzOaWBkGnwEdPtLKnTdFZGtiBXFOjsQmXOARm: _2f696e6465782e6a73_0,
        EXfhzWjFLhitZcmWlSTDSaStAOWBqElbLlbrPkPCxmXCs: _2f696e6465782e6a73_1,
      };
    `);
  });
});
