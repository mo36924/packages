#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { getSchema } from "@mo36924/graphql";
import { buildDrizzleSchema } from "../drizzle";

const { config, schema } = getSchema();

if (config.schema && config.drizzle) {
  const drizzleSchema = buildDrizzleSchema(config.drizzle, schema);
  writeFileSync(config.drizzle, drizzleSchema);
}
