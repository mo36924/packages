import ts from "typescript";
import { graphql } from "./graphql";
import { volar } from "./volar";

const pluginModuleFactory: ts.server.PluginModuleFactory = (mod) => {
  const pluginModules = [graphql(mod), volar(mod)];
  return {
    create(createInfo) {
      return pluginModules.reduce(
        (languageService, module) => module.create({ ...createInfo, languageService }),
        createInfo.languageService,
      );
    },
    getExternalFiles(proj, updateLevel) {
      return pluginModules.flatMap((module) => module.getExternalFiles?.(proj, updateLevel) ?? []);
    },
    onConfigurationChanged(config) {
      pluginModules.forEach((module) => module.onConfigurationChanged?.(config));
    },
  };
};

export default pluginModuleFactory;
