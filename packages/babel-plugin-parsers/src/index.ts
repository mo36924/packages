import { declare } from "@babel/helper-plugin-utils";

const getPlugin = (plugin: string | [string, object]) => (typeof plugin === "string" ? plugin : plugin[0]);

export default declare(() => {
  return {
    name: "babel-plugin-parsers",
    visitor: {},
    manipulateOptions({ filename = "" }, parserOpts) {
      if (/\.d\.[cm]?ts$/.test(filename)) {
        parserOpts.plugins = [
          ["typescript", { dts: true }],
          ...parserOpts.plugins.filter((plugin: string | [string, object]) => getPlugin(plugin) !== "typescript"),
        ];

        return;
      }

      if (/\.[cm]?jsx$/.test(filename)) {
        parserOpts.plugins = [
          "jsx",
          ...parserOpts.plugins.filter((plugin: string | [string, object]) => getPlugin(plugin) !== "jsx"),
        ];
      }

      if (/\.[cm]?tsx?$/.test(filename)) {
        parserOpts.plugins = [
          "typescript",
          ...parserOpts.plugins.filter((plugin: string | [string, object]) => getPlugin(plugin) !== "typescript"),
        ];
      }
    },
  };
});
