import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { NodePath, PluginObj, PluginPass, types as t, traverse } from "@babel/core";
import { declare } from "@babel/helper-plugin-utils";
import { deadCodeElimination } from "babel-dead-code-elimination";
import { hexToText, toServerFunctionId } from "./utils";

const __SERVER_FUNCTIONS__ = "__SERVER_FUNCTIONS__";

export type Options = {
  server?: boolean;
  client?: string;
  serverFunctionIds?: string[];
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

const fetchPath = join(fileURLToPath(import.meta.url), "..", "fetch.");
const fetchPaths = ["js", "cjs", "ts"].map((extname) => fetchPath + extname);

const serverPlugin = declare<Options, PluginObj<State>>((_api, { serverFunctionIds }) => {
  return {
    pre(file) {
      if (!serverFunctionIds || !fetchPaths.includes(this.filename ?? "")) {
        return;
      }

      const _serverFunctionIds = [...new Set(serverFunctionIds)].sort();

      file.path.unshiftContainer(
        "body",
        _serverFunctionIds.map((id) => {
          const [_, hexFilepath] = id.split("_");
          const path = hexToText(hexFilepath);
          return t.importDeclaration([t.importSpecifier(t.identifier(id), t.identifier(id))], t.stringLiteral(path));
        }),
      );

      traverse(
        file.ast,
        {
          VariableDeclaration(path) {
            const declaration = path.get("declarations")[0];

            if (declaration.get("id").isIdentifier({ name: __SERVER_FUNCTIONS__ })) {
              declaration
                .get("init")
                .replaceWith(
                  t.objectExpression(
                    _serverFunctionIds.map((id) => t.objectProperty(t.stringLiteral(hash(id)), t.identifier(id))),
                  ),
                );
            }
          },
          IfStatement(path) {
            const test = path.node.test;

            if (
              t.isUnaryExpression(test, { operator: "!" }) &&
              t.isIdentifier(test.argument, { name: __SERVER_FUNCTIONS__ })
            ) {
              path.remove();
            }
          },
        },
        file.scope,
        this,
      );

      deadCodeElimination({ ...file.ast, errors: [] });
    },
    visitor: {
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

const clientPlugin = declare<Options, PluginObj<State>>((_api, { serverFunctionIds, client = "client" }) => {
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
        const serverFunctionPath = serverFunctionIds ? hash(serverFunctionId) : serverFunctionId;

        if (serverFunctionIds) {
          serverFunctionIds.push(serverFunctionId);
        }

        const args = getServerFunctionArgs(path);

        path.replaceWith({
          ...path.node,
          async: false,
          body: t.blockStatement([
            t.returnStatement(
              t.callExpression(t.identifier(state.clientId), [
                t.stringLiteral(serverFunctionPath),
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
});

export default declare<Options>((api, options, dirname) => {
  if (options.server) {
    return serverPlugin(api, options, dirname);
  } else {
    return clientPlugin(api, options, dirname);
  }
});
