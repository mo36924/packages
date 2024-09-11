import { SnapshotSerializer } from "vitest";

const Raw = Symbol.for("vitest-snapshot-serializer-raw");

export const raw = (value: string) => ({ [Raw]: value });

export default {
  test: (value) => !!value && typeof value[Raw] === "string",
  serialize: (value) => value[Raw],
} satisfies SnapshotSerializer;
