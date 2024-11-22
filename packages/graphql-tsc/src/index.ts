import { createRequire } from "node:module";
import { getLanguagePlugin } from "@mo36924/graphql-plugin/volar";
import { runTsc } from "@volar/typescript/lib/quickstart/runTsc.js";

const require = createRequire(import.meta.url);
const tscPath = require.resolve("typescript/lib/tsc");
runTsc(tscPath, [], () => [getLanguagePlugin()]);
