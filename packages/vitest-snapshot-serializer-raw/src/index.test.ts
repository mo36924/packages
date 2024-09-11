import { expect, it } from "vitest";
import snapshotSerializer, { raw } from "./index";

expect.addSnapshotSerializer(snapshotSerializer);

it("vitest-snapshot-serializer-raw", () => {
  const value = "serialize";
  expect(snapshotSerializer.test(raw(value))).toBeTruthy();
  expect(snapshotSerializer.serialize(raw(value))).toEqual(value);
  expect(value).toMatchInlineSnapshot(`"serialize"`);
  expect(raw(value)).toMatchInlineSnapshot(`serialize`);
});
