import { getSchema } from "@mo36924/graphql";
import { GraphQLError } from "graphql";
import {
  CompletionItemKind,
  DIAGNOSTIC_SEVERITY,
  getAutocompleteSuggestions,
  getDiagnostics,
  getHoverInformation,
  getTokenAtPosition,
  Position,
} from "graphql-language-service";
import ts from "typescript";
import { DiagnosticSeverity } from "vscode-languageserver-types";

export const graphql: ts.server.PluginModuleFactory = ({ typescript: ts }) => {
  const isQueryTag = (node: ts.Node): node is ts.TaggedTemplateExpression =>
    ts.isTaggedTemplateExpression(node) && ts.isIdentifier(node.tag) && node.tag.escapedText === "gql";

  const getScriptElementKind = (completionItemKind: CompletionItemKind | undefined): ts.ScriptElementKind => {
    switch (completionItemKind) {
      case CompletionItemKind.Function:
      case CompletionItemKind.Constructor:
        return ts.ScriptElementKind.functionElement;
      case CompletionItemKind.Field:
      case CompletionItemKind.Variable:
        return ts.ScriptElementKind.memberVariableElement;
      default:
        return ts.ScriptElementKind.unknown;
    }
  };

  const getDiagnosticCategory = (diagnosticSeverity: DiagnosticSeverity | undefined): ts.DiagnosticCategory => {
    switch (diagnosticSeverity) {
      case DIAGNOSTIC_SEVERITY.Warning:
        return ts.DiagnosticCategory.Warning;
      case DIAGNOSTIC_SEVERITY.Information:
        return ts.DiagnosticCategory.Message;
      case DIAGNOSTIC_SEVERITY.Hint:
        return ts.DiagnosticCategory.Suggestion;
      default:
        return ts.DiagnosticCategory.Error;
    }
  };

  const getHoverQueryTag = (sourceFile: ts.SourceFile, position: number) => {
    const tag = ts.forEachChild(sourceFile, function visitor(node): true | undefined | ts.TaggedTemplateExpression {
      if (position < node.pos) {
        return true;
      }

      if (position >= node.end) {
        return;
      }

      if (isQueryTag(node)) {
        const template = node.template;

        if (ts.isNoSubstitutionTemplateLiteral(template)) {
          if (position >= template.getStart() + 1 && position < template.getEnd() - 1) {
            return node;
          }
        } else {
          const head = template.head;

          if (position >= head.getStart() + 1 && position < head.getEnd() - 2) {
            return node;
          }

          for (const { literal } of template.templateSpans) {
            if (
              position >= literal.getStart() + 1 &&
              position < literal.getEnd() - (ts.isTemplateMiddle(literal) ? 2 : 1)
            ) {
              return node;
            }
          }
        }
      }

      return ts.forEachChild(node, visitor);
    });

    if (tag === true) {
      return;
    }

    return tag;
  };

  return {
    create(info) {
      const { schema } = getSchema(info.project.getCurrentDirectory());
      const languageService = info.languageService;

      const getSourceFile = (fileName: string) => languageService.getProgram()?.getSourceFile(fileName);

      const normalizeQuery = (node: ts.TaggedTemplateExpression) => {
        const template = node.template;
        let query = "";

        if (ts.isNoSubstitutionTemplateLiteral(template)) {
          // 2 \`\`
          const templateWidth = template.getWidth() - 2;
          query = template.text.padStart(templateWidth);
        } else {
          const head = template.head;
          const templateSpans = template.templateSpans;

          // 3 \`...\${
          const templateWidth = head.getWidth() - 3;
          query = head.text.padStart(templateWidth);

          templateSpans.forEach((span, i) => {
            const spanWidth = span.getFullWidth();
            const literal = span.literal;
            const literalWidth = literal.getWidth();
            const expressionWidth = spanWidth - literalWidth;
            const variableName = `$_${i}`;
            const variable = variableName.padStart(expressionWidth + 2).padEnd(expressionWidth + 3);
            const templateWidth = literalWidth - (ts.isTemplateTail(literal) ? 2 : 3);
            const template = literal.text.padStart(templateWidth);
            query += variable + template;
          });
        }

        const field = query.match(/\w+/)?.[0] ?? "";
        const isMutation = !!schema.getMutationType()?.getFields()[field];
        const operation = isMutation ? "mutation" : "";
        query = operation + query.replace(/\n|\r/g, " ");
        const offset = -operation.length + template.getStart() + 1;

        return { query, offset };
      };

      const proxy: ts.LanguageService = {
        ...languageService,
        getQuickInfoAtPosition(fileName, position) {
          const sourceFile = getSourceFile(fileName);

          if (!sourceFile) {
            return;
          }

          const tag = getHoverQueryTag(sourceFile, position);

          if (!tag) {
            return languageService.getQuickInfoAtPosition(fileName, position);
          }

          const { query, offset } = normalizeQuery(tag);
          const cursor = new Position(0, position - offset);
          const token = getTokenAtPosition(query, cursor);
          const marked = getHoverInformation(schema, query, cursor, token);

          if (marked === "" || typeof marked !== "string") {
            return;
          }

          return {
            kind: ts.ScriptElementKind.string,
            textSpan: {
              start: offset + token.start,
              length: token.end - token.start,
            },
            kindModifiers: "",
            displayParts: [{ text: marked, kind: "" }],
          };
        },
        getCompletionsAtPosition(fileName, position, options) {
          const sourceFile = getSourceFile(fileName);

          if (!sourceFile) {
            return;
          }

          const tag = getHoverQueryTag(sourceFile, position);

          if (!tag) {
            return languageService.getCompletionsAtPosition(fileName, position, options);
          }

          const { query, offset } = normalizeQuery(tag);
          const cursor = new Position(0, position - offset);
          const items = getAutocompleteSuggestions(schema, query, cursor);

          if (/^\s*\{\s*\}\s*$/.test(query)) {
            const operation = "mutation";
            const cursor = new Position(0, operation.length + position - offset);
            const labels = new Set(items.map((item) => item.label));

            const mutationItems = getAutocompleteSuggestions(schema, operation + query, cursor).filter(
              (item) => !labels.has(item.label),
            );

            items.push(...mutationItems);
          }

          if (!items.length) {
            return;
          }

          return {
            isGlobalCompletion: false,
            isMemberCompletion: false,
            isNewIdentifierLocation: false,
            entries: items.map((item) => ({
              name: item.label,
              kindModifiers: "",
              kind: getScriptElementKind(item.kind),
              sortText: "",
            })),
          };
        },
        getSemanticDiagnostics(fileName) {
          const diagnostics = languageService.getSemanticDiagnostics(fileName);
          const sourceFile = getSourceFile(fileName);

          if (!sourceFile) {
            return diagnostics;
          }

          ts.forEachChild(sourceFile, function visitor(node) {
            if (isQueryTag(node)) {
              try {
                const { query, offset } = normalizeQuery(node);
                const _diagnostics = getDiagnostics(query, schema);

                for (const {
                  range: { start, end },
                  severity,
                  message,
                } of _diagnostics) {
                  if (/Variable "\$.*?" is not defined/.test(message)) {
                    continue;
                  }

                  diagnostics.push({
                    category: getDiagnosticCategory(severity),
                    code: 9999,
                    messageText: message,
                    file: sourceFile,
                    start: start.character + offset,
                    length: end.character - start.character,
                  });
                }
              } catch (error) {
                if (error instanceof GraphQLError) {
                  diagnostics.push({
                    category: ts.DiagnosticCategory.Error,
                    code: 9999,
                    messageText: error.message,
                    file: sourceFile,
                    start: node.template.getStart() + 1,
                    length: node.template.getWidth() - 2,
                  });
                }
              }
            }

            ts.forEachChild(node, visitor);
          });

          return diagnostics;
        },
      };

      return proxy;
    },
  };
};
