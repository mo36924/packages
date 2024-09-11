import { SnapshotSerializer } from "vitest";
import { Raw } from "./wrap";

export default {
  test: (value) => !!value && typeof value[Raw] === "string",
  serialize: (value) => value[Raw],
} satisfies SnapshotSerializer;
