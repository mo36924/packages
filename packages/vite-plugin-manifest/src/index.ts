import { relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { ManifestChunk, normalizePath, Plugin } from "vite";
import viteManifest from "./manifest";

const manifestJsonPath = "manifest.json";
const manifestModulePath = fileURLToPath(new URL("manifest.js", import.meta.url));
const manifestModulePaths = [".js", ".cjs"].map((extname) => normalizePath(manifestModulePath + extname));

export default (): Plugin => {
  let isSsrBuild: boolean = false;
  return {
    name: "vite-plugin-manifest",
    apply: (_config, { isSsrBuild }) => !isSsrBuild,
    config(_config, env) {
      isSsrBuild = !!env.isSsrBuild;

      if (isSsrBuild) {
        return;
      }

      return { build: { manifest: manifestJsonPath } };
    },
    configResolved(config) {
      if (isSsrBuild) {
        return;
      }

      const input = config.build.rollupOptions.input ?? [];
      const inputs = typeof input === "string" ? [input] : Object.values(input);
      const paths = inputs.map((input) => relative(".", input).split(sep).join("/"));

      Object.assign(
        viteManifest,
        Object.fromEntries(paths.map((path) => [path, { file: path, isEntry: true } satisfies ManifestChunk])),
      );
    },
    load(id) {
      if (!manifestModulePaths.includes(id)) {
        return;
      }

      return `export default Object.assign(Object.create(null), JSON.parse(${JSON.stringify(JSON.stringify(viteManifest))}))`;
    },
    generateBundle: {
      order: "post",
      handler(_, bundle) {
        if (isSsrBuild) {
          return;
        }

        if (bundle[manifestJsonPath]?.type !== "asset") {
          return;
        }

        for (const key of Object.keys(viteManifest)) {
          delete bundle[key];
        }

        Object.assign(viteManifest, JSON.parse(`${bundle[manifestJsonPath].source}`));
        delete bundle[manifestJsonPath];
      },
    },
  };
};
