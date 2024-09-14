import { expect, it } from "vitest";
import { printDirectives } from "./directives";

it("printDirectives", () => {
  expect(printDirectives({ field: { name: "user", key: "userId" } })).toMatchInlineSnapshot(
    `"@field(name:"user" key:"userId" )"`,
  );
});
