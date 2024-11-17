import devServer from "@hono/vite-dev-server";
import { build, Plugin } from "vite";

export default ({ input, assets }: { input: string; assets: string[] }): Plugin[] => {
  let isSsrBuild = false;
  return [
    {
      name: "vite-plugin-ssr",
      config: (_config, env) => {
        isSsrBuild = !!env.isSsrBuild;
        return {
          build: {
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
      async writeBundle() {
        if (!isSsrBuild) {
          await build({ build: { ssr: true } });
        }
      },
    },
    devServer({ entry: input }),
  ];
};
