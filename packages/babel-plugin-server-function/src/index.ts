import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { env } from "node:process";
import { fileURLToPath } from "node:url";
import { NodePath, PluginObj, PluginPass, types as t, template } from "@babel/core";
import { declare } from "@babel/helper-plugin-utils";
import { deadCodeElimination } from "babel-dead-code-elimination";
import functions from "./functions";

export type Options = {
  development?: boolean;
  ssr?: boolean;
  client?: string;
};

type State = PluginPass & {
  clientId?: string;
  serverFunctionIndex?: number;
};

const functionsPaths = ["js", "cjs", "ts"].map((extname) =>
  join(fileURLToPath(import.meta.url), "..", `functions.${extname}`),
);

const findProgram = (path: NodePath<t.Node>): NodePath<t.Program> => {
  const program = path.findParent((path) => path.isProgram());

  if (!program?.isProgram()) {
    throw path.buildCodeFrameError("Not found program.");
  }

  return program;
};

const checkServerFunction = (path: NodePath<t.Function>): path is NodePath<t.Function & { body: t.BlockStatement }> => {
  const { async, body } = path.node;

  const isServerFunction =
    t.isBlockStatement(body) && body.directives.some((directive) => directive.value.value === "use server");

  if (!async && isServerFunction) {
    throw path.buildCodeFrameError("Server functions must be async.");
  }

  return isServerFunction;
};

const getServerFunctionName = (path: NodePath, state: State): string => {
  if (!state.filename) {
    throw path.buildCodeFrameError("Filename is required.");
  }

  state.serverFunctionIndex ??= 0;
  const serverFunctionName = `_${Buffer.from(state.filename).toString("hex")}_${state.serverFunctionIndex++}`;
  return serverFunctionName;
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

// const serverPlugin = declare<Options, PluginObj<State>>((_api, { development }) => {
//   return {
//     visitor: {
//       VariableDeclarator(path, { filename = "" }) {
//         if (
//           development ||
//           !(functionsPaths.includes(filename) && path.get("id").isIdentifier({ name: functionsName }))
//         ) {
//           return;
//         }

//         const program = findProgram(path);
//         serverFunctionIds.sort();

//         program.unshiftContainer(
//           "body",
//           serverFunctionIds.map((id) => {
//             const [_, hexFilepath] = id.split("_");
//             const path = hexToText(hexFilepath);
//             return t.importDeclaration([t.importSpecifier(t.identifier(id), t.identifier(id))], t.stringLiteral(path));
//           }),
//         );

//         path
//           .get("init")
//           .replaceWith(
//             t.callExpression(t.memberExpression(t.identifier("Object"), t.identifier("assign")), [
//               t.callExpression(t.memberExpression(t.identifier("Object"), t.identifier("create")), [t.nullLiteral()]),
//               t.objectExpression(
//                 serverFunctionIds.map((id) => t.objectProperty(t.stringLiteral(hash(id)), t.identifier(id))),
//               ),
//             ]),
//           );
//       },
//       Function(path, state) {
//         if (!checkServerFunction(path)) {
//           return;
//         }

//         const program = findProgram(path);
//         const serverFunctionId = getServerFunctionId(path, state);
//         const { body, generator, async } = path.node;
//         const args = getServerFunctionArgs(path);

//         program.pushContainer(
//           "body",
//           t.exportNamedDeclaration(
//             t.functionDeclaration(
//               t.identifier(serverFunctionId),
//               args.map((arg) => t.identifier(arg)),
//               t.blockStatement(body.body),
//               generator,
//               async,
//             ),
//           ),
//         );

//         path.replaceWith({ ...path.node, body: t.blockStatement(body.body) });
//       },
//     },
//   };
// });

// const clientPlugin = declare<Options, PluginObj<State>>(
//   (_api, { client = "@mo36924/babel-plugin-server-function/client" }) => {
//     return {
//       visitor: {
//         Function(path, state) {
//           if (!checkServerFunction(path)) {
//             return;
//           }

//           const program = findProgram(path);

//           if (!state.clientId) {
//             state.clientId = path.scope.generateUid("client");

//             program.unshiftContainer(
//               "body",
//               t.importDeclaration([t.importDefaultSpecifier(t.identifier(state.clientId))], t.stringLiteral(client)),
//             );
//           }

//           const serverFunctionId = getServerFunctionId(path, state);
//           const serverFunctionIdHash = hash(serverFunctionId);

//           if (!serverFunctionIds.includes(serverFunctionId)) {
//             serverFunctionIds.push(serverFunctionId);

//             functions[serverFunctionIdHash] = (...args: any[]) =>
//               import(state.filename!).then((mod) => mod[serverFunctionId](...args));
//           }

//           const args = getServerFunctionArgs(path);

//           path.replaceWith({
//             ...path.node,
//             async: false,
//             body: t.blockStatement([
//               t.returnStatement(
//                 t.callExpression(t.identifier(state.clientId), [
//                   t.stringLiteral(serverFunctionIdHash),
//                   ...args.map((arg) => t.identifier(arg)),
//                 ]),
//               ),
//             ]),
//           });
//         },
//       },
//       post(file) {
//         if (!this.serverFunctionIndex) {
//           return;
//         }

//         deadCodeElimination({ ...file.ast, errors: [] });
//       },
//     };
//   },
// );

const serverFunctions: { [hash: string]: { path: string; name: string } } = Object.create(null);

export default declare<Options, PluginObj<State>>(
  (
    _api,
    {
      development = env.NODE_ENV === "development",
      ssr = false,
      client = "@mo36924/babel-plugin-server-function/client",
    },
  ) => {
    return {
      name: "babel-plugin-server-function",
      visitor: {
        Program(path, { filename = "" }) {
          if (development || !functionsPaths.includes(filename)) {
            return;
          }

          for (const statement of path.get("body")) {
            statement.remove();
          }

          path.pushContainer(
            "body",
            template.statements.ast(
              `${Object.values(serverFunctions)
                .map(({ name, path }) => `import { ${name} } from ${JSON.stringify(path)}\n`)
                .join(
                  "",
                )}export default Object.assign(Object.create(null), {${Object.entries(serverFunctions).map(([key, { name }]) => `${JSON.stringify(key)}: ${name}`)}})`,
            ),
          );
        },
        Function(path, state) {
          if (!checkServerFunction(path)) {
            return;
          }

          const program = findProgram(path);
          const name = getServerFunctionName(path, state);
          const args = getServerFunctionArgs(path);
          const key = createHash("sha256").update(name).digest("base64url");

          if (ssr) {
            const { body, generator, async } = path.node;

            program.pushContainer(
              "body",
              t.exportNamedDeclaration(
                t.functionDeclaration(
                  t.identifier(name),
                  args.map((arg) => t.identifier(arg)),
                  t.blockStatement(body.body),
                  generator,
                  async,
                ),
              ),
            );

            path.replaceWith({ ...path.node, body: t.blockStatement(body.body) });
          } else {
            if (!state.clientId) {
              state.clientId = path.scope.generateUid("client");

              program.unshiftContainer(
                "body",
                t.importDeclaration([t.importDefaultSpecifier(t.identifier(state.clientId))], t.stringLiteral(client)),
              );
            }

            // functions[key] = Object.assign(
            //   async (..._args: any[]) => {
            //     throw new Error("Server function is not implemented.");
            //   },
            //   { key, path: _path, _name: name },
            // );

            const filename = state.filename;

            if (!filename) {
              throw path.buildCodeFrameError("Filename is required.");
            }

            functions[key] = (...args: any[]) => import(filename).then((mod) => mod[name](...args));
            serverFunctions[key] = { path: filename, name };

            path.replaceWith({
              ...path.node,
              async: false,
              body: t.blockStatement([
                t.returnStatement(
                  t.callExpression(t.identifier(state.clientId), [
                    t.stringLiteral(key),
                    ...args.map((arg) => t.identifier(arg)),
                  ]),
                ),
              ]),
            });
          }
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
