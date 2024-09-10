import { watch } from "node:fs";
import { generateRoutes, Options } from "@mo36924/route-generator";
import { Plugin } from "vite";

export default (options: Options): Plugin => {
  const _generateRoutes = generateRoutes.bind(null, options);
  return {
    name: "vite-plugin-route-generator",
    async configResolved(config) {
      await _generateRoutes();

      if (config.mode === "development") {
        // @ts-expect-error: There are no watchers defined globally
        globalThis.watcher?.close();
        // @ts-expect-error: There are no watchers defined globally
        globalThis.watcher = watch(options.rootDir ?? "src/pages", { recursive: true }, _generateRoutes);
      }
    },
  };
};
