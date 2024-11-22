/// <reference types="@volar/typescript" />

import { getGqlTypeArguments, getSchema } from "@mo36924/graphql";
import { CodeInformation, CodeMapping, LanguagePlugin, VirtualCode } from "@volar/language-core";
import { createLanguageServicePlugin } from "@volar/typescript/lib/quickstart/createLanguageServicePlugin.js";
import ts from "typescript";

const tag = "gql";

const data: CodeInformation = {
  completion: true,
  format: false,
  navigation: true,
  semantic: true,
  structure: true,
  verification: true,
};

const getText = (snapshot: ts.IScriptSnapshot) => snapshot.getText(0, snapshot.getLength());

const getCodeMappings = (text: string): CodeMapping[] => [
  { sourceOffsets: [0], generatedOffsets: [0], lengths: [text.length], data },
];

export const getLanguagePlugin = (cwd?: string) => {
  const { schema } = getSchema(cwd);

  const transform = (sourceFile: ts.SourceFile): { snapshot: ts.IScriptSnapshot; mappings: CodeMapping[] } => {
    const code = sourceFile.text;
    const sourceOffsets: number[] = [0];
    const generatedOffsets: number[] = [0];
    const lengths: number[] = [];
    let offset = 0;
    let generatedCode = "";

    ts.forEachChild(sourceFile, function cb(node) {
      if (
        ts.isTaggedTemplateExpression(node) &&
        ts.isIdentifier(node.tag) &&
        node.tag.text === tag &&
        !node.typeArguments
      ) {
        const typeArguments = getGqlTypeArguments(schema, node);

        if (typeArguments) {
          const end = node.tag.end;
          generatedCode += code.substring(offset, end) + typeArguments;
          sourceOffsets.push(end);
          generatedOffsets.push(generatedCode.length);
          lengths.push(end - offset);
          offset = end;
        }
      }

      ts.forEachChild(node, cb);
    });

    generatedCode += code.substring(offset);
    lengths.push(code.length - offset);
    const snapshot = ts.ScriptSnapshot.fromString(generatedCode);
    return {
      snapshot,
      mappings: [
        {
          sourceOffsets,
          generatedOffsets,
          lengths,
          data,
        },
      ],
    };
  };

  const languagePlugin: LanguagePlugin<
    string,
    VirtualCode & { source?: { sourceFile: ts.SourceFile; snapshot: ts.IScriptSnapshot } }
  > = {
    getLanguageId() {
      return undefined;
    },
    createVirtualCode(scriptId, languageId, snapshot) {
      if (
        (languageId !== "typescript" && languageId !== "typescriptreact") ||
        scriptId.includes("node_modules") ||
        scriptId.endsWith(".d.ts")
      ) {
        return;
      }

      const text = getText(snapshot);

      if (!text.includes("gql")) {
        return {
          id: scriptId,
          languageId,
          snapshot,
          mappings: getCodeMappings(text),
        };
      }

      const sourceFile = ts.createSourceFile(scriptId, text, 99 satisfies ts.ScriptTarget.Latest);
      const result = transform(sourceFile);
      return {
        id: scriptId,
        languageId,
        ...result,
        source: { sourceFile, snapshot },
      };
    },
    updateVirtualCode(scriptId, virtualCode, snapshot) {
      const text = getText(snapshot);

      if (!text.includes("gql")) {
        return {
          ...virtualCode,
          snapshot,
          mappings: getCodeMappings(text),
          source: undefined,
        };
      }

      let sourceFile: ts.SourceFile;

      if (virtualCode.source) {
        const change = snapshot.getChangeRange(virtualCode.source.snapshot);

        if (change) {
          sourceFile = virtualCode.source.sourceFile.update(text, change);
        }
      }

      sourceFile ??= ts.createSourceFile(scriptId, text, 99 satisfies ts.ScriptTarget.Latest);
      const result = transform(sourceFile);
      return {
        ...virtualCode,
        ...result,
        source: { sourceFile, snapshot },
      };
    },
    typescript: {
      extraFileExtensions: [],
      getServiceScript(code) {
        const isTs = code.languageId === "typescript";
        return {
          code,
          extension: isTs ? ".ts" : ".tsx",
          scriptKind: isTs ? ts.ScriptKind.TS : ts.ScriptKind.TSX,
        };
      },
    },
  };

  return languagePlugin;
};

export const volar: ts.server.PluginModuleFactory = createLanguageServicePlugin((_ts, info) => ({
  languagePlugins: [getLanguagePlugin(info.project.getCurrentDirectory())],
}));
