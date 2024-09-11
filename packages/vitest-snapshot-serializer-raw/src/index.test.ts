import { expect, it } from "vitest";
import snapshotSerializer from "./index";
import { wrap } from "./wrap";

expect.addSnapshotSerializer(snapshotSerializer);

it("vitest-snapshot-serializer-raw", () => {
  const value = "serialize";
  expect(snapshotSerializer.test(wrap(value))).toBeTruthy();
  expect(snapshotSerializer.serialize(wrap(value))).toEqual(value);
  expect(value).toMatchInlineSnapshot(`"serialize"`);
  expect(wrap(value)).toMatchInlineSnapshot(`serialize`);
});
