import { expect, it } from "vitest";
import { hexToText, textToHex, toServerFunctionId } from "./utils";

const path = "/index.ts";

it("hex", () => {
  const hex = textToHex(path);
  const text = hexToText(hex);
  expect(/^[0-9a-f]+$/.test(hex)).toBeTruthy();
  expect(text).toBe(path);
  expect(hex).toMatchInlineSnapshot(`"2f696e6465782e7473"`);
  expect(text).toMatchInlineSnapshot(`"/index.ts"`);
});

it("toServerFunctionId", () => {
  const serverFunctionId = toServerFunctionId(path, 0);
  expect(serverFunctionId).toMatchInlineSnapshot(`"_2f696e6465782e7473_0"`);
});
