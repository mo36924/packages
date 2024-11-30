import { D1Database } from "@cloudflare/workers-types";
import { escapeText } from "@mo36924/escape-html";
import { stringify } from "@mo36924/json";
import { renderToStringAsync } from "preact-render-to-string";
import { ReactNode } from "react";
import { QueryProvider, ServerProvider } from "./react";

export const render = async (
  serverContext: { request: Request; env: { DB: D1Database } },
  Router: (props: { pathname: string }) => ReactNode,
) => {
  const queryContext = {};

  const html = await renderToStringAsync(
    <ServerProvider value={serverContext}>
      <QueryProvider value={queryContext}>
        <Router pathname={new URL(serverContext.request.url).pathname} />
      </QueryProvider>
    </ServerProvider>,
  );

  return `<!DOCTYPE html>${`${html.slice(0, -7)}<script id="context" type="application/json">${escapeText(stringify(queryContext))}</script></html>`}`;
};
