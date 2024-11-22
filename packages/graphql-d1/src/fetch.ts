import { D1Database } from "@cloudflare/workers-types";
import { queries } from "@mo36924/babel-plugin-graphql/queries";
import { schema } from "@mo36924/babel-plugin-graphql/schema";
import { buildExecutionContext } from "graphql/execution/execute";
import { buildQuery } from "./query";

export type Env = {
  DB: D1Database;
};

const basePathname = "/graphql";

const badRequest = () => new Response(null, { status: 400, statusText: "Bad Request" });
const internalServerError = () => new Response(null, { status: 500, statusText: "Internal Server Error" });

const fetchRequestHandler = (request: Request, env: Env) => {
  const url = request.url;

  if (!url.includes(basePathname)) {
    return;
  }

  const _url = new URL(request.url);
  const pathname = _url.pathname;

  if (pathname === basePathname) {
    if (request.method !== "GET") {
      throw new Response(null, { status: 405, statusText: "Method Not Allowed", headers: { allow: "GET" } });
    }

    const searchParams = _url.searchParams;
    const query = searchParams.get("query");

    if (!query) {
      return badRequest();
    }

    const document = queries[query];

    if (!document) {
      return badRequest();
    }

    let variables: Record<string, any> | undefined;
    const _variables = searchParams.get("variables");

    if (_variables) {
      try {
        variables = JSON.parse(_variables);
      } catch {
        return badRequest();
      }
    }

    const context = buildExecutionContext({
      schema,
      document,
      variableValues: variables,
    });

    if ("at" in context) {
      return badRequest();
    }

    const [sql, values] = buildQuery(context);

    return env.DB.prepare(sql)
      .bind(...values)
      .first<any>("data")
      .then((data) => new Response(data, { headers: { "Content-Type": "application/json" } }))
      .catch(() => internalServerError());
  }
};

export { fetchRequestHandler as fetch, queries, schema };
