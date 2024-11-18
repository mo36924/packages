import prettier from "@prettier/sync";
import { SnapshotSerializer } from "vitest";

const options = { ...prettier.resolveConfig("index.tsx"), plugins: [], filepath: "index.tsx" };

const format = (source: string) => {
  let _error;

  for (let i = 2; i--; ) {
    try {
      return prettier.format(source, options);
    } catch (error) {
      _error = error;
    }
  }

  throw _error;
};

export default {
  test: (value) => typeof value?.code === "string" && "map" in value,
  serialize: (value) => format(value.code),
} satisfies SnapshotSerializer;
