import { SnapshotSerializer } from "vitest";

export default {
  test: (value) => typeof value?.code === "string" && "map" in value,
  serialize: (value) => value.code,
} satisfies SnapshotSerializer;
