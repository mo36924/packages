import { expect, it } from "vitest";
import { relative } from "./index";

it("relative", () => {
  const importSource = relative("src/index.ts", "src/utils/index.ts");
  expect(importSource).toMatchInlineSnapshot(`"./utils/index.ts"`);
});
