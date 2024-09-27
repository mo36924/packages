import { FSWatcher, watch } from "node:fs";
import { generateRoutes, getOptions, getRoutes, Options } from "@mo36924/route-generator";
import { Plugin } from "vite";

const _globalThis: { watcher?: FSWatcher } = globalThis as any;

export type { Options };

export default (options: Options = {}): Plugin => {
  const { rootDir, outFile } = getOptions(options);
  return {
    name: "vite-route-generator",
    async configResolved(config) {
      if (!config.build.ssr) {
        await generateRoutes(options);
      }

      if (config.mode === "development") {
        _globalThis.watcher?.close();
        _globalThis.watcher = watch(rootDir, { recursive: true }, () => generateRoutes(options));
      }
    },
    load(id, { ssr } = {}) {
      if (ssr && id === outFile) {
        return getRoutes({ ...options, dynamicImport: false });
      }
    },
  };
};
