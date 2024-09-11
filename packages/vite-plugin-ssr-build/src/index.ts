import { build, Plugin } from "vite";

export default (): Plugin => {
  let isSsrBuild: boolean | undefined;
  return {
    name: "vite-plugin-ssr-build",
    configResolved(config) {
      isSsrBuild = !!config.build.ssr;
    },
    async writeBundle() {
      if (!isSsrBuild) {
        await build({ build: { ssr: true } });
      }
    },
  };
};
