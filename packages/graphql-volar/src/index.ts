import { createLanguageServicePlugin } from "@volar/typescript/lib/quickstart/createLanguageServicePlugin";
import { getLanguagePlugin } from "./plugin";

const plugin = createLanguageServicePlugin((_ts, info) => ({
  languagePlugins: [getLanguagePlugin(info.project.getCurrentDirectory())],
}));

export default plugin;
