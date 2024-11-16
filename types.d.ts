declare module "@babel/plugin-syntax-jsx";
declare module "babel-plugin-minify-dead-code-elimination";

declare module "eslint-plugin-no-relative-import-paths" {
  import { ESLint } from "eslint";

  const plugin: ESLint.Plugin;

  export default plugin;
}
