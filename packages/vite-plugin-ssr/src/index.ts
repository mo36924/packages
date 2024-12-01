import { build, Manifest, Plugin } from "vite";

export type Options = {
  input: string;
  assets: string[];
};

const manifestPath = "manifest.json";

export const manifest: Manifest = ((globalThis as any).__VITE_PLUGIN_SSR_MANIFEST__ ??= Object.create(null));

export const ssr = ({ input, assets }: Options): Plugin => {
  let isSsrBuild = false;
  return {
    name: "vite-plugin-ssr",
    config: (_config, env) => {
      isSsrBuild = !!env.isSsrBuild;

      if (!isSsrBuild) {
        for (const asset of assets) {
          const normalizedPath = asset.replace(/^\.\//, "");
          manifest[normalizedPath] = { file: normalizedPath, isEntry: true };
        }
      }

      return {
        build: {
          manifest: !isSsrBuild && manifestPath,
          target: isSsrBuild ? "node20" : "modules",
          emptyOutDir: !isSsrBuild,
          minify: true,
          outDir: isSsrBuild ? "dist" : "dist/public",
          copyPublicDir: !isSsrBuild,
          rollupOptions: {
            input: isSsrBuild ? input : assets,
            output: {
              inlineDynamicImports: isSsrBuild,
            },
          },
        },
        resolve: {
          conditions: ["source", "browser", "import"],
        },
        ssr: { noExternal: isSsrBuild ? true : undefined, resolve: { conditions: ["source", "import", "node"] } },
      };
    },
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        if (isSsrBuild) {
          return;
        }

        const output = bundle[manifestPath];

        if (output.type !== "asset") {
          return;
        }

        Object.assign(manifest, JSON.parse(`${output.source}`));
        delete bundle[manifestPath];
      },
    },
    async writeBundle() {
      if (!isSsrBuild) {
        await build({ build: { ssr: true } });
      }
    },
  };
};
