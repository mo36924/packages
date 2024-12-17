import { build, Plugin } from "vite";

export const ssrBuild = (): Plugin => {
  return {
    name: "vite-plugin-ssr-build",
    apply(_config, { isSsrBuild }) {
      return !isSsrBuild;
    },
    async writeBundle() {
      await build({ build: { ssr: true } });
    },
  };
};
