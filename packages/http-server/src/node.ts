import { createServer as createNodeServer } from "node:http";
import { env } from "node:process";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { ReadableStream as NodeWebReadableStream } from "node:stream/web";

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
      (init as any).duplex = "half";
      init.body = Readable.toWeb(req) as ReadableStream;
    }

    const request = new Request(url, init);
    const response = await requestListener(request);
    res.writeHead(response.status, [...response.headers]);

    if (response.body) {
      await pipeline(Readable.fromWeb(response.body as NodeWebReadableStream), res);
    } else {
      res.end();
    }
  }).listen(env.PORT || 8080);
};
