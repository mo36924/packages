import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { NodePath, PluginObj, PluginPass, types as t } from "@babel/core";
import { declare } from "@babel/helper-plugin-utils";
import { deadCodeElimination } from "babel-dead-code-elimination";
import basex from "base-x";

export type Options = {
  development?: boolean;
  server?: boolean;
  runtime?: string;
};

type State = PluginPass & {
  runtimeId?: string;
  createServerFunctionIndex?: number;
};

const base52 = basex("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz");
const hash = (data: string) => base52.encode(createHash("sha256").update(data).digest());

const serverFunctionSet = new Set<string>();

const checkServerFunction = (
  path: NodePath<t.Function>,
): path is
  | NodePath<t.FunctionDeclaration>
  | NodePath<t.FunctionExpression>
  | NodePath<t.ArrowFunctionExpression & { body: t.BlockStatement }> => {
  const { async, body } = path.node;

  if (
    !(
      (path.isFunctionDeclaration() || path.isFunctionExpression() || path.isArrowFunctionExpression()) &&
      t.isBlockStatement(body) &&
      body.directives.some((directive) => directive.value.value === "use server")
    )
  ) {
    return false;
  }

  if (!async) {
    throw path.buildCodeFrameError("Server functions must be asynchronous functions.");
  }

  return true;
};

const getServerFunctionId = (path: NodePath, state: State): string => {
  if (!state.filename) {
    throw path.buildCodeFrameError("Filename is required.");
  }

  state.createServerFunctionIndex ??= 0;
  const id = `_${Buffer.from(state.filename).toString("hex")}_${state.createServerFunctionIndex++}`;
  return id;
};

const findProgram = (path: NodePath<t.Node>): NodePath<t.Program> => {
  const program = path.findParent((path) => path.isProgram());

  if (!program?.isProgram()) {
    throw path.buildCodeFrameError("Not found program.");
  }

  return program;
};

const fetchPath = join(fileURLToPath(import.meta.url), "..", "fetch.");
const fetchPaths = ["js", "cjs", "ts"].map((extname) => fetchPath + extname);

const serverPlugin = declare<Options, PluginObj<State>>(() => {
  const visitServerFunction = (path: NodePath<t.Function>, state: State) => {
    if (!checkServerFunction(path)) {
      return;
    }

    const program = findProgram(path);
    const serverFunctionId = getServerFunctionId(path, state);
    const { params, body, generator, async } = path.node;

    program.pushContainer(
      "body",
      t.exportNamedDeclaration(
        t.functionDeclaration(t.identifier(serverFunctionId), params, t.blockStatement(body.body), generator, async),
      ),
    );

    if (t.isFunctionDeclaration(path.node) && path.node.id) {
      path.scope.rename(path.node.id.name, serverFunctionId);
      path.remove();
    } else {
      path.replaceWith(t.identifier(serverFunctionId));
    }
  };

  return {
    name: "babel-plugin-server-function-use-server",
    pre(file) {
      if (!fetchPaths.includes(this.filename ?? "")) {
        return;
      }

      const serverFunctionIds = [...serverFunctionSet];

      file.path.unshiftContainer("body", [
        ...serverFunctionIds.map((id) => {
          const [_, hexFilepath] = id.split("_");
          const path = Buffer.from(hexFilepath, "hex").toString();
          return t.importDeclaration([t.importSpecifier(t.identifier(id), t.identifier(id))], t.stringLiteral(path));
        }),
        t.variableDeclaration("const", [
          t.variableDeclarator(
            t.identifier("serverFunctions"),
            t.objectExpression(
              serverFunctionIds.map((id) => t.objectProperty(t.identifier(hash(id)), t.identifier(id))),
            ),
          ),
        ]),
      ]);
    },
    visitor: {
      FunctionDeclaration: visitServerFunction,
      FunctionExpression: visitServerFunction,
      ArrowFunctionExpression: visitServerFunction,
    },
  };
});

const clientPlugin = declare<Options, PluginObj<State>>(
  (_api, { development, runtime = "@mo36924/babel-plugin-server-function/runtime" }) => {
    const visitServerFunction = (path: NodePath<t.Function>, state: State) => {
      if (!checkServerFunction(path)) {
        return;
      }

      const program = findProgram(path);

      if (!state.runtimeId) {
        state.runtimeId = path.scope.generateUid("runtime");

        program.unshiftContainer(
          "body",
          t.importDeclaration([t.importDefaultSpecifier(t.identifier(state.runtimeId))], t.stringLiteral(runtime)),
        );
      }

      const serverFunctionId = getServerFunctionId(path, state);
      const serverFunctionPath = development ? serverFunctionId : hash(serverFunctionId);

      serverFunctionSet.add(serverFunctionId);

      program.unshiftContainer(
        "body",
        t.variableDeclaration("const", [
          t.variableDeclarator(
            t.identifier(serverFunctionId),
            t.callExpression(t.identifier(state.runtimeId), [t.stringLiteral(serverFunctionPath)]),
          ),
        ]),
      );

      if (t.isFunctionDeclaration(path.node) && path.node.id) {
        path.scope.rename(path.node.id.name, serverFunctionId);
        path.remove();
      } else {
        path.replaceWith(t.identifier(serverFunctionId));
      }
    };

    return {
      name: "babel-plugin-server-function-use-client",
      post(file) {
        if (this.runtimeId) {
          deadCodeElimination({ ...file.ast, errors: [] });
        }
      },
      visitor: {
        FunctionDeclaration: visitServerFunction,
        FunctionExpression: visitServerFunction,
        ArrowFunctionExpression: visitServerFunction,
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
