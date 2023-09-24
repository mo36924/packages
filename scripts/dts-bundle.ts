// import { Extractor, ExtractorConfig } from "@microsoft/api-extractor";
// import { readdir, unlink } from "fs/promises";
// import { createRequire } from "module";
// import { resolve } from "path";

// const require = createRequire(import.meta.url);
// const path = require.resolve("@microsoft/api-extractor");
// const _require = createRequire(path);
// const ts: typeof import("typescript") = _require("typescript");
// const { getParsedCommandLineOfConfigFile, sys, createProgram, createCompilerHost } = ts;

// const { fileNames = [], options = {} } =
//   getParsedCommandLineOfConfigFile(
//     "tsconfig.json",
//     { noEmit: false, outDir: undefined, declaration: true, emitDeclarationOnly: true },
//     { ...sys, onUnRecoverableConfigFileDiagnostic() {} },
//   ) ?? {};

// const host = createCompilerHost(options);
// const files: string[] = [];
// let program = createProgram({
//   rootNames: fileNames,
//   options,
//   host: {
//     ...host,
//     writeFile(...args) {
//       files.push(args[0]);
//       host.writeFile(...args);
//     },
//   },
// });
// program.emit();
// program = createProgram({
//   rootNames: [...fileNames, ...files],
//   options,
//   host,
//   oldProgram: program,
// });

// const config = ExtractorConfig.prepare({
//   configObject: {
//     mainEntryPointFilePath: "index.d.ts",
//     compiler: { tsconfigFilePath: "tsconfig.json" },
//     projectFolder: process.cwd(),
//     dtsRollup: { enabled: true },
//   },
//   ignoreMissingEntryPoint: true,
//   configObjectFullPath: undefined,
//   packageJsonFullPath: resolve("package.json"),
// });
// const workspace = "packages";
// const dirs = await readdir(workspace);
// for (const dir of dirs) {
//   Extractor.invoke(
//     {
//       ...config,
//       _getShortFilePath: config._getShortFilePath,
//       getDiagnosticDump: config.getDiagnosticDump,
//       mainEntryPointFilePath: resolve(workspace, dir, "src", "index.d.ts"),
//       publicTrimmedFilePath: resolve(workspace, dir, "dist", "index.d.ts"),
//     },
//     { compilerState: { program } },
//   );
// }
// await Promise.all(files.map(unlink));
