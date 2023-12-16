import { createServer as createNodeServer } from "http";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

export const createHttpServer = (requestListener: (request: Request) => Response | Promise<Response>) => {
  createNodeServer(async (req, res) => {
    const method = req.method;
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/48895
    const headers = req.headers as Record<string, string>;
    const url = `http://${headers.host}${req.url}`;
    const ctrl = new AbortController();
    req.once("aborted", () => ctrl.abort());

    const init: RequestInit = {
      method,
      headers,
      signal: ctrl.signal,
      referrer: headers.referrer,
    };

    if (method !== "GET" && method !== "HEAD") {
      // @ts-ignore
      init.duplex = "half";
      // @ts-ignore
      init.body = Readable.toWeb(req);
    }

    const request = new Request(url, init);
    const response = await requestListener(request);
    res.writeHead(response.status, [...response.headers]);

    if (response.body) {
      // @ts-ignore
      await pipeline(Readable.fromWeb(response.body), res);
    } else {
      res.end();
    }
  }).listen(process.env.PORT || 8080);
};
