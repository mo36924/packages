#!/usr/bin/env node
import { ConfigEnv, loadConfigFromFile, Plugin } from "vite";
import { name } from "./name";

const bin = async () => {
  const configEnv: ConfigEnv = { command: "build", mode: "production" };
  const result = await loadConfigFromFile(configEnv);
  const config = result?.config;

  if (!config) {
    return;
  }

  const plugins = await Promise.all(config.plugins?.flat() ?? []);
  const plugin = plugins.find((plugin): plugin is Plugin => !!(plugin && "name" in plugin && plugin.name === name));
  const configHook = plugin?.config;

  if (typeof configHook !== "function") {
    return;
  }

  await configHook(config, configEnv);
};

bin();
