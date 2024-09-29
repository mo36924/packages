#!/usr/bin/env node
import { createRequire } from "node:module";
import { runTsc } from "@volar/typescript/lib/quickstart/runTsc";
import { getLanguagePlugin } from "./plugin";

const require = createRequire(import.meta.url);
const tscPath = require.resolve("typescript/lib/tsc");
runTsc(tscPath, [], () => [getLanguagePlugin()]);
