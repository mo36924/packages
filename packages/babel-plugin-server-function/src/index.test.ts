import { fileURLToPath } from "node:url";
import { transformFileSync, transformSync } from "@babel/core";
import { expect, it } from "vitest";
import plugin, { Options } from "./index";
import { toServerFunctionId } from "./utils";

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

const transformFetch = (options: Options) =>
  transformFileSync(fileURLToPath(new URL("fetch.ts", import.meta.url)), {
    parserOpts: { plugins: ["typescript"] },
    plugins: [[plugin, options]],
  });

it("client-development", () => {
  const result = transform({ server: false });

  expect(result).toMatchInlineSnapshot(`
    import _client from "client";
    type A = string;
    const serverFunction = (arg, { prop }, [value], ...args) => {
      return _client("_2f696e6465782e7473_0", arg, prop, value, args);
    };
    function serverFunction1(arg, { prop }, [value], ...args) {
      return _client("_2f696e6465782e7473_1", arg, prop, value, args);
    }
    export default async (...args) => {
      const data = await serverFunction(...args);
      const data1 = await serverFunction1(...args);
      return [data, data1];
    };
  `);
});

it("client-production", () => {
  const serverFunctionIds: string[] = [];
  const result = transform({ server: false, serverFunctionIds });

  expect(result).toMatchInlineSnapshot(`
    import _client from "client";
    type A = string;
    const serverFunction = (arg, { prop }, [value], ...args) => {
      return _client("B-Ey_vbGUGuUxwTitwko3pzAcbh_1qVULE07GsfsCG8", arg, prop, value, args);
    };
    function serverFunction1(arg, { prop }, [value], ...args) {
      return _client("0Awf45xy9l01x9xBXhrrDjdhg6ix2VhQaC7j8h9vCN4", arg, prop, value, args);
    }
    export default async (...args) => {
      const data = await serverFunction(...args);
      const data1 = await serverFunction1(...args);
      return [data, data1];
    };
  `);

  expect(serverFunctionIds).toMatchInlineSnapshot(`
    [
      "_2f696e6465782e7473_0",
      "_2f696e6465782e7473_1",
    ]
  `);
});

it("server", () => {
  const result = transform({ server: true });

  expect(result).toMatchInlineSnapshot(`
    import { readFile } from "fs/promises";
    const a = 1;
    type A = string;
    const serverFunction = async (arg, { prop }, [value], ...args) => {
      console.log(a);
      console.log(arg);
      console.log(prop);
      console.log(value);
      console.log(args);
      const data: A = await readFile(arg, "utf-8");
      return data;
    };
    async function serverFunction1(arg, { prop }, [value], ...args) {
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

it("fetch-development", async () => {
  const result = transformFetch({ server: true });

  expect(result).toMatchInlineSnapshot(`
    import { stringify } from "@mo36924/json";
    import { BASE_PATHNAME } from "./constants";
    import { hexToText } from "./utils";

    // __SERVER_FUNCTIONS__ is set to a value by Babel
    const __SERVER_FUNCTIONS__:
      | {
          [id: string]: (...args: any[]) => Promise<any>;
        }
      | undefined = undefined as any;
    const basePathLength = BASE_PATHNAME.length;
    const createResponse = (data = null) =>
      new Response(stringify(data), {
        headers: {
          "Content-Type": "application/json",
        },
      });
    const fetchRequestHandler = (request: Request) => {
      const url = request.url;
      if (!url.includes(BASE_PATHNAME)) {
        return;
      }
      const pathname = new URL(url).pathname;
      if (!pathname.startsWith(BASE_PATHNAME)) {
        return;
      }
      const id = pathname.slice(basePathLength);
      if (!__SERVER_FUNCTIONS__) {
        const [_, hexFilepath] = id.split("_");
        const response = Promise.all([import(hexToText(hexFilepath)), request.json()])
          .then(([mod, args]) => mod[id](...args))
          .then(createResponse);
        return response;
      }
      const serverFunction = __SERVER_FUNCTIONS__[id];
      if (!serverFunction) {
        return;
      }
      const response = request
        .json()
        .then((data) => serverFunction(...data))
        .then(createResponse);
      return response;
    };
    export default fetchRequestHandler;
  `);
});

it("fetch-production", () => {
  const result = transformFetch({
    server: true,
    serverFunctionIds: [toServerFunctionId("/index.ts", 0), toServerFunctionId("/index.ts", 1)],
  });

  expect(result).toMatchInlineSnapshot(`
    import { _2f696e6465782e7473_0 } from "/index.ts";
    import { _2f696e6465782e7473_1 } from "/index.ts";
    import { stringify } from "@mo36924/json";
    import { BASE_PATHNAME } from "./constants";
    // __SERVER_FUNCTIONS__ is set to a value by Babel
    const __SERVER_FUNCTIONS__:
      | {
          [id: string]: (...args: any[]) => Promise<any>;
        }
      | undefined = {
      "B-Ey_vbGUGuUxwTitwko3pzAcbh_1qVULE07GsfsCG8": _2f696e6465782e7473_0,
      "0Awf45xy9l01x9xBXhrrDjdhg6ix2VhQaC7j8h9vCN4": _2f696e6465782e7473_1,
    };
    const basePathLength = BASE_PATHNAME.length;
    const createResponse = (data = null) =>
      new Response(stringify(data), {
        headers: {
          "Content-Type": "application/json",
        },
      });
    const fetchRequestHandler = (request: Request) => {
      const url = request.url;
      if (!url.includes(BASE_PATHNAME)) {
        return;
      }
      const pathname = new URL(url).pathname;
      if (!pathname.startsWith(BASE_PATHNAME)) {
        return;
      }
      const id = pathname.slice(basePathLength);
      const serverFunction = __SERVER_FUNCTIONS__[id];
      if (!serverFunction) {
        return;
      }
      const response = request
        .json()
        .then((data) => serverFunction(...data))
        .then(createResponse);
      return response;
    };
    export default fetchRequestHandler;
  `);
});
