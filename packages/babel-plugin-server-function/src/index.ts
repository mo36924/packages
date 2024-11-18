import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { NodePath, PluginObj, PluginPass, types as t } from "@babel/core";
import { declare } from "@babel/helper-plugin-utils";
import { deadCodeElimination } from "babel-dead-code-elimination";
import { functions } from "./functions";
import { hexToText, toServerFunctionId } from "./utils";

const functionsName = "functions";
const functionsPath = join(fileURLToPath(import.meta.url), "..", "functions.");
const functionsPaths = ["js", "cjs", "ts"].map((extname) => functionsPath + extname);
const serverFunctionIds: string[] = ((globalThis as any).__SERVER_FUNCTION_IDS__ ??= []);

export type Options = {
  server?: boolean;
  client?: string;
  development?: boolean;
};

type State = PluginPass & {
  clientId?: string;
  serverFunctionIndex?: number;
};

const hash = (data: string) => createHash("sha256").update(data).digest("base64url");

const findProgram = (path: NodePath<t.Node>): NodePath<t.Program> => {
  const program = path.findParent((path) => path.isProgram());

  if (!program?.isProgram()) {
    throw path.buildCodeFrameError("Not found program.");
  }

  return program;
};

const checkServerFunction = (path: NodePath<t.Function>): path is NodePath<t.Function & { body: t.BlockStatement }> => {
  const body = path.node.body;
  return t.isBlockStatement(body) && body.directives.some((directive) => directive.value.value === "use server");
};

const getServerFunctionId = (path: NodePath, state: State): string => {
  if (!state.filename) {
    throw path.buildCodeFrameError("Filename is required.");
  }

  state.serverFunctionIndex ??= 0;
  const serverFunctionId = toServerFunctionId(state.filename, state.serverFunctionIndex++);
  return serverFunctionId;
};

const getServerFunctionArgs = (path: NodePath<t.Function>) => {
  const scope = path.scope;
  const topLevelBindings = Object.values(scope.getProgramParent().bindings);

  const args = Object.entries(scope.getAllBindings())
    .filter(
      ([name, binding]) =>
        !topLevelBindings.includes(binding) &&
        (!scope.hasOwnBinding(name) || binding.kind === "param") &&
        binding.referencePaths.some((referencePath) => referencePath.findParent((parent) => parent === path)),
    )
    .map(([name]) => name);

  return args;
};

const serverPlugin = declare<Options, PluginObj<State>>((_api, { development }) => {
  return {
    visitor: {
      VariableDeclarator(path, { filename = "" }) {
        if (
          development ||
          !(functionsPaths.includes(filename) && path.get("id").isIdentifier({ name: functionsName }))
        ) {
          return;
        }

        const program = findProgram(path);
        serverFunctionIds.sort();

        program.unshiftContainer(
          "body",
          serverFunctionIds.map((id) => {
            const [_, hexFilepath] = id.split("_");
            const path = hexToText(hexFilepath);
            return t.importDeclaration([t.importSpecifier(t.identifier(id), t.identifier(id))], t.stringLiteral(path));
          }),
        );

        path
          .get("init")
          .replaceWith(
            t.callExpression(t.memberExpression(t.identifier("Object"), t.identifier("assign")), [
              t.callExpression(t.memberExpression(t.identifier("Object"), t.identifier("create")), [t.nullLiteral()]),
              t.objectExpression(
                serverFunctionIds.map((id) => t.objectProperty(t.stringLiteral(hash(id)), t.identifier(id))),
              ),
            ]),
          );
      },
      Function(path, state) {
        if (!checkServerFunction(path)) {
          return;
        }

        const program = findProgram(path);
        const serverFunctionId = getServerFunctionId(path, state);
        const { body, generator, async } = path.node;
        const args = getServerFunctionArgs(path);

        program.pushContainer(
          "body",
          t.exportNamedDeclaration(
            t.functionDeclaration(
              t.identifier(serverFunctionId),
              args.map((arg) => t.identifier(arg)),
              t.blockStatement(body.body),
              generator,
              async,
            ),
          ),
        );

        path.replaceWith({ ...path.node, body: t.blockStatement(body.body) });
      },
    },
  };
});

const clientPlugin = declare<Options, PluginObj<State>>(
  (_api, { client = "@mo36924/babel-plugin-server-function/client" }) => {
    return {
      visitor: {
        Function(path, state) {
          if (!checkServerFunction(path)) {
            return;
          }

          const program = findProgram(path);

          if (!state.clientId) {
            state.clientId = path.scope.generateUid("client");

            program.unshiftContainer(
              "body",
              t.importDeclaration([t.importDefaultSpecifier(t.identifier(state.clientId))], t.stringLiteral(client)),
            );
          }

          const serverFunctionId = getServerFunctionId(path, state);
          const serverFunctionIdHash = hash(serverFunctionId);

          if (!serverFunctionIds.includes(serverFunctionId)) {
            serverFunctionIds.push(serverFunctionId);

            functions[serverFunctionIdHash] = (...args: any[]) =>
              import(state.filename!).then((mod) => mod[serverFunctionId](...args));
          }

          const args = getServerFunctionArgs(path);

          path.replaceWith({
            ...path.node,
            async: false,
            body: t.blockStatement([
              t.returnStatement(
                t.callExpression(t.identifier(state.clientId), [
                  t.stringLiteral(serverFunctionIdHash),
                  ...args.map((arg) => t.identifier(arg)),
                ]),
              ),
            ]),
          });
        },
      },
      post(file) {
        if (!this.serverFunctionIndex) {
          return;
        }

        deadCodeElimination({ ...file.ast, errors: [] });
      },
    };
  },
);

export default declare<Options>((api, options, dirname) => {
  if (options.server) {
    return serverPlugin(api, options, dirname);
  } else {
    return clientPlugin(api, options, dirname);
  }
});
