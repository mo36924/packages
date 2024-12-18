import { D1Database } from "@cloudflare/workers-types";
import documents from "@mo36924/babel-plugin-graphql/documents";
import schema from "@mo36924/babel-plugin-graphql/schema";
import { buildQuery } from "@mo36924/graphql-d1/query";
import { parse } from "@mo36924/json";
import { buildExecutionContext } from "graphql/execution/execute";
import { createContext, useContext } from "react";
import { UseQuery } from "./react.browser";

export const ServerContext = createContext<{ request: Request; env: { DB: D1Database } }>(null as any);

export const ServerProvider = ServerContext.Provider;

export const QueryContext = createContext<Record<string, any>>(null as any);

export const QueryProvider = QueryContext.Provider;

export const useQuery: UseQuery = ({ query, variables }) => {
  const { env } = useContext(ServerContext);
  const queryContext = useContext(QueryContext);

  const document = documents[query];

  if (!document) {
    throw new Error("Bad Request");
  }

  const executionContext = buildExecutionContext({
    schema,
    document,
    variableValues: variables,
  });

  if ("at" in executionContext) {
    throw new Error("Bad Request");
  }

  const url = `/graphql?query=${query}${variables ? `&variables=${encodeURIComponent(JSON.stringify(variables))}` : ""}`;
  const [sql, values] = buildQuery(executionContext);

  const data = (queryContext[url] ??= env.DB.prepare(sql)
    .bind(...values)
    .first<any>("data")
    .then((data) => (queryContext[url] = parse(data))));

  if (typeof data.then === "function") {
    throw data;
  }

  return { data };
};
