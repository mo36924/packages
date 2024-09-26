import { format, resolveConfig } from "@prettier/sync";
import { SnapshotSerializer } from "vitest";

const config = { ...resolveConfig("index.tsx"), filepath: "index.tsx" };

export default {
  test: (value) => typeof value?.code === "string" && "ast" in value && "map" in value && "metadata" in value,
  serialize: (value) => format(value.code, config),
} satisfies SnapshotSerializer;
