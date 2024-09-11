import { Plugin } from "vite";

export type Options = {
  server?: string;
  client?: string[];
};

export default ({
  server = "src/server/index.tsx",
  client = ["src/styles/index.css", "src/client/index.tsx"],
}: Options = {}): Plugin => ({
  name: "vite-plugin-config",
  config: (_, { command, isSsrBuild }) => ({
    build: {
      emptyOutDir: !isSsrBuild,
      minify: command === "build",
      rollupOptions: {
        input: isSsrBuild ? server : client,
        output: {
          inlineDynamicImports: isSsrBuild,
          entryFileNames: isSsrBuild ? "index.js" : "public/assets/[hash].js",
          chunkFileNames: isSsrBuild ? "[hash].js" : "public/assets/[hash].js",
          assetFileNames: isSsrBuild ? "[hash][extname]" : "public/assets/[hash][extname]",
        },
        preserveEntrySignatures: false,
      },
    },
    ssr: { noExternal: true },
  }),
});
