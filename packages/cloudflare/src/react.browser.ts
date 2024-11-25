import { parse } from "@mo36924/json";
import { createContext, useContext, useEffect, useState } from "react";

const textContent = document.getElementById("context")?.textContent;
const context = textContent ? parse(textContent) : {};

export const QueryContext = createContext<Record<string, any>>(context);

export const QueryProvider = QueryContext.Provider;

export type UseQuery = <TData>(params: {
  query: string;
  variables?: Record<string, any>;
  _data: TData;
  _operation: "query";
}) => { data?: TData };

export const useQuery: UseQuery = ({ query, variables }) => {
  const context = useContext(QueryContext);
  const url = `/graphql?query=${query}${variables ? `&variables=${encodeURIComponent(JSON.stringify(variables))}` : ""}`;
  const [data, setData] = useState(context[url]);

  useEffect(() => {
    data ??
      fetch(url)
        .then((res) => res.text())
        .then((text) => setData((context[url] = parse(text))));
  }, [data, url]);

  return { data };
};
