import { writeFileSync } from "node:fs";
import { getSchema } from "./config";
import { buildDeclaration } from "./typescript";

const { config, schema } = getSchema();

if (config.schema && config.dts) {
  const dts = buildDeclaration(config.dts, schema);
  writeFileSync(config.dts, dts);
}
