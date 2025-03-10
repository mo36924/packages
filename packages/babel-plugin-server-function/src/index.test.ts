import { fileURLToPath } from "node:url";
import { transformFileSync, transformSync } from "@babel/core";
import { expect, it } from "vitest";
import functions from "./functions";
import plugin, { Options } from "./index";

const code = `
  import { readFile } from "fs/promises";

  const a = 1
  type A = string

  const serverFunction = async (arg, { prop }, [value], ...args) => {
    "use server";
    console.log(a)
    console.log(arg)
    console.log(prop)
    console.log(value)
    console.log(args)
    const data: A = await readFile(arg, "utf-8");
    return data;
  }

  async function serverFunction1(arg, { prop }, [value], ...args){
    "use server";
    console.log(a)
    console.log(arg)
    console.log(prop)
    console.log(value)
    console.log(args)
    const data: A = await readFile(arg, "utf-8");
    return data;
  }

  export default async (...args) => {
    const data = await serverFunction(...args);
    const data1 = await serverFunction1(...args);
    return [data, data1]
  };
`;

const transform = (options: Options = {}) =>
  transformSync(code, {
    filename: "/index.ts",
    parserOpts: { plugins: ["typescript"] },
    plugins: [[plugin, options]],
  });

const transformFunctions = (options: Options) =>
  transformFileSync(fileURLToPath(new URL("functions.ts", import.meta.url)), {
    parserOpts: { plugins: ["typescript"] },
    plugins: [[plugin, options]],
  });

it("client", () => {
  const result = transform({ ssr: false });

  expect(result).toMatchInlineSnapshot(`
    import _client from "@mo36924/babel-plugin-server-function/client";
    type A = string;
    const serverFunction = (arg, {
      prop
    }, [value], ...args) => {
      return _client("B-Ey_vbGUGuUxwTitwko3pzAcbh_1qVULE07GsfsCG8", arg, prop, value, args);
    };
    function serverFunction1(arg, {
      prop
    }, [value], ...args) {
      return _client("0Awf45xy9l01x9xBXhrrDjdhg6ix2VhQaC7j8h9vCN4", arg, prop, value, args);
    }
    export default async (...args) => {
      const data = await serverFunction(...args);
      const data1 = await serverFunction1(...args);
      return [data, data1];
    };
  `);
});

it("server", () => {
  const result = transform({ ssr: true });

  expect(result).toMatchInlineSnapshot(`
    import { readFile } from "fs/promises";
    const a = 1;
    type A = string;
    const serverFunction = async (arg, {
      prop
    }, [value], ...args) => {
      console.log(a);
      console.log(arg);
      console.log(prop);
      console.log(value);
      console.log(args);
      const data: A = await readFile(arg, "utf-8");
      return data;
    };
    async function serverFunction1(arg, {
      prop
    }, [value], ...args) {
      console.log(a);
      console.log(arg);
      console.log(prop);
      console.log(value);
      console.log(args);
      const data: A = await readFile(arg, "utf-8");
      return data;
    }
    export default async (...args) => {
      const data = await serverFunction(...args);
      const data1 = await serverFunction1(...args);
      return [data, data1];
    };
    export async function _2f696e6465782e7473_0(arg, prop, value, args) {
      console.log(a);
      console.log(arg);
      console.log(prop);
      console.log(value);
      console.log(args);
      const data: A = await readFile(arg, "utf-8");
      return data;
    }
    export async function _2f696e6465782e7473_1(arg, prop, value, args) {
      console.log(a);
      console.log(arg);
      console.log(prop);
      console.log(value);
      console.log(args);
      const data: A = await readFile(arg, "utf-8");
      return data;
    }
  `);
});

it("functions-development", async () => {
  transform({ ssr: false });
  const result = transformFunctions({ ssr: true, development: true });

  expect(result).toMatchInlineSnapshot(`
    const functions: {
      [hash: string]: {
        (...args: any[]): Promise<any>;
        _: {
          key: string;
          path: string;
          name: string;
        };
      };
    } = Object.create(null);
    export default new Proxy(functions, {
      get(_, key: string) {
        const fn = functions[key];
        if (!fn) {
          return;
        }
        return Object.assign(async (...args: any[]) => {
          const data = await import(fn._.path);
          return data[fn._.name](...args);
        }, {
          _: fn._
        });
      }
    });
  `);

  expect(functions).toMatchInlineSnapshot(`
    {
      "0Awf45xy9l01x9xBXhrrDjdhg6ix2VhQaC7j8h9vCN4": [Function],
      "B-Ey_vbGUGuUxwTitwko3pzAcbh_1qVULE07GsfsCG8": [Function],
    }
  `);
});

it("functions-production", () => {
  transform({ ssr: false });
  const result = transformFunctions({ ssr: true });

  expect(result).toMatchInlineSnapshot(`
    import { _2f696e6465782e7473_0 } from "/index.ts";
    import { _2f696e6465782e7473_1 } from "/index.ts";
    export default Object.assign(Object.create(null), {
      "B-Ey_vbGUGuUxwTitwko3pzAcbh_1qVULE07GsfsCG8": _2f696e6465782e7473_0,
      "0Awf45xy9l01x9xBXhrrDjdhg6ix2VhQaC7j8h9vCN4": _2f696e6465782e7473_1
    });
  `);
});
