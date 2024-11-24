import { parse } from "@mo36924/json";
import { createContext, useContext } from "react";

const textContent = document.getElementById("context")?.textContent;
const context = textContent ? parse(textContent) : {};

export const QueryContext = createContext<Record<string, any>>(context);

export const QueryProvider = QueryContext.Provider;

export type UseQuery = <TData>(params: {
  query: string;
  variables?: Record<string, any>;
  _data: TData;
  _operation: "query";
}) => TData;

export const useQuery: UseQuery = ({ query, variables }) => {
  const context = useContext(QueryContext);
  const url = `/graphql?query=${query}${variables ? `&variables=${encodeURIComponent(JSON.stringify(variables))}` : ""}`;

  const data = (context[url] ??= fetch(url)
    .then((res) => res.text())
    .then((text) => (context[url] = parse(text))));

  if (typeof data.then === "function") {
    throw data;
  }

  return data;
};
