#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { runTsc } from "@volar/typescript/lib/quickstart/runTsc";
import { getLanguagePlugin } from "./plugin";

const tscPath = fileURLToPath(import.meta.resolve("typescript/lib/tsc"));
runTsc(tscPath, [], () => [getLanguagePlugin()]);
