import { transformSync } from "@babel/core";
import presetApp, { Options as PresetAppOptions } from "@mo36924/babel-preset-app";
import { Manifest, ManifestChunk, Plugin } from "vite";

const manifestPath = "manifest.json";
let manifest: Manifest = {};

export default (): Plugin => {
  let isBuild: boolean | undefined;
  let isSsrBuild: boolean | undefined;
  return {
    name: "vite-plugin-babel",
    enforce: "pre",
    async config(_, env) {
      isBuild = env.command === "build";
      isSsrBuild = env.isSsrBuild;

      if (!isSsrBuild) {
        return { build: { manifest: manifestPath } };
      }
    },
    configResolved(config) {
      if (!isSsrBuild) {
        const input = config.build?.rollupOptions?.input;
        const inputs = typeof input === "string" ? [input] : Object.values(input ?? {});
        manifest = Object.fromEntries(inputs.map((file) => [file, { file, isEntry: true } satisfies ManifestChunk]));
      }
    },
    generateBundle: {
      order: "post",
      handler(_, bundle) {
        if (bundle[manifestPath]?.type === "asset") {
          manifest = JSON.parse(bundle[manifestPath].source.toString());
        }
      },
    },
    transform(code, id, { ssr } = {}) {
      if (!(id.endsWith(".ts") || id.endsWith(".tsx") || id.includes("@mo36924"))) {
        return;
      }

      const result = transformSync(code, {
        babelrc: false,
        configFile: false,
        browserslistConfigFile: false,
        sourceMaps: true,
        filename: id,
        parserOpts: {
          plugins: ["jsx", "typescript"],
        },
        presets: [[presetApp, { server: ssr, development: !isBuild, manifest } satisfies PresetAppOptions]],
      });

      return { code: result?.code ?? code, map: result?.map };
    },
  };
};
