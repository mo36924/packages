declare module "@babel/plugin-syntax-jsx";

declare module "eslint-plugin-no-relative-import-paths" {
  import { ESLint } from "eslint";

  const plugin: ESLint.Plugin;

  export default plugin;
}
