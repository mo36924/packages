import { DocumentNode, GraphQLSchema, parse, validate } from "graphql";
import { buildExecutionContext, ExecutionContext } from "graphql/execution/execute";

export type Options = {
  schema: GraphQLSchema;
  execute: (context: ExecutionContext) => Promise<string>;
};

const basePath = "/graphql";

export const createGraphQLRequestHandler =
  ({ schema, execute }: Options) =>
  ({ url, method }: Request) => {
    if (!url.includes(basePath)) {
      return;
    }

    const _url = new URL(url);
    const pathname = _url.pathname;

    if (pathname !== basePath) {
      return;
    }

    if (method !== "GET") {
      throw new Response(null, { status: 405, statusText: "Method Not Allowed", headers: { allow: "GET" } });
    }

    const searchParams = _url.searchParams;
    const query = searchParams.get("query");

    if (!query) {
      return new Response(null, { status: 400, statusText: "Bad Request" });
    }

    let variables: Record<string, any> | undefined;
    const _variables = searchParams.get("variables");

    if (_variables) {
      try {
        variables = JSON.parse(_variables);
      } catch {
        throw new Response(null, { status: 400, statusText: "Bad Request" });
      }
    }

    let document: DocumentNode;

    try {
      document = parse(query, { noLocation: true });
    } catch {
      return new Response(null, { status: 400, statusText: "Bad Request" });
    }

    const errors = validate(schema, document);

    if (errors.length) {
      return new Response(null, { status: 400, statusText: "Bad Request" });
    }

    const context = buildExecutionContext({
      schema,
      document,
      variableValues: variables,
    });

    if ("at" in context) {
      return new Response(null, { status: 400, statusText: "Bad Request" });
    }

    return execute(context).then(
      (data) => new Response(data, { headers: { "Content-Type": "application/json" } }),
      () => new Response(null, { status: 500, statusText: "Internal Server Error" }),
    );
  };
