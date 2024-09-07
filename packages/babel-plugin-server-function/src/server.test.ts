import { transformSync } from "@babel/core";
import { expect, it } from "vitest";
import plugin, { Options } from "./index";

it("babel-plugin-server-function-use-server", () => {
  const code = `
    const serverFunction = async () => {
      "use server";
      const result = await Promise.resolve(0);
      return result;
    }

    async function serverFunction1(){
      "use server";
      const result = await Promise.resolve(1);
      return result;
    }

    const fn = () => {
      const sf = async () => {
        "use server";
        const result = await Promise.resolve(2);
        return result;
      };
      return sf();
    }
  `;

  const result = transformSync(code, { filename: "/index.js", plugins: [[plugin, { server: true } as Options]] });

  expect(result).toMatchInlineSnapshot(`
    const serverFunction = _2f696e6465782e6a73_0;
    const fn = () => {
      const sf = _2f696e6465782e6a73_2;
      return sf();
    };
    export async function _2f696e6465782e6a73_0() {
      const result = await Promise.resolve(0);
      return result;
    }
    export async function _2f696e6465782e6a73_1() {
      const result = await Promise.resolve(1);
      return result;
    }
    export async function _2f696e6465782e6a73_2() {
      const result = await Promise.resolve(2);
      return result;
    }
  `);
});
