import { transformSync } from "@babel/core";
import { expect, it } from "vitest";
import snapshotSerializer from "./index";

expect.addSnapshotSerializer(snapshotSerializer);

it("vitest-snapshot-serializer-babel", () => {
  const code = `const a = 1; const b = 2;`;
  const result = transformSync(code);

  expect(result?.code).toMatchInlineSnapshot(`
    "const a = 1;
    const b = 2;"
  `);

  expect(result).toMatchInlineSnapshot(`
    const a = 1;
    const b = 2;
  `);
});
