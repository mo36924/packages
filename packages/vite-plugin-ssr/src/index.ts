import devServer from "@hono/vite-dev-server";
import { build, Manifest, ManifestChunk, Plugin } from "vite";

const manifestPath = "manifest.json";

export const manifest: Manifest = ((globalThis as any).__VITE_PLUGIN_SSR_MANIFEST__ ??= Object.create(null));

export const ssr = ({ input, assets }: { input: string; assets: string[] }): Plugin[] => {
  let isSsrBuild = false;
  return [
    {
      name: "vite-plugin-ssr",
      config: (_config, env) => {
        isSsrBuild = !!env.isSsrBuild;

        if (!isSsrBuild) {
          Object.assign(
            manifest,
            assets.map((file) => {
              const normalizedPath = file.replace(/^\.\//, "");
              return [normalizedPath, { file: normalizedPath, isEntry: true } satisfies ManifestChunk];
            }),
          );
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
          ssr: isSsrBuild ? { noExternal: true } : undefined,
        };
      },
      generateBundle: isSsrBuild
        ? undefined
        : {
            order: "post",
            handler(_options, bundle) {
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
    },
    devServer({ entry: input }),
  ];
};
