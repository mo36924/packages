#!/usr/bin/env node
import { D1Database } from "@cloudflare/workers-types";
import { getSchema } from "@mo36924/graphql";
import { getPlatformProxy } from "wrangler";
import { buildData } from "../data";

const { config, schema } = getSchema();

if (config.schema) {
  const seed = async () => {
    const data = buildData(schema);
    const proxy = await getPlatformProxy<{ DB: D1Database }>();
    await proxy.env.DB.exec(data).catch(() => {});
    await proxy.dispose();
  };

  seed().catch(console.error);
}
