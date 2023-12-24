import { createServer } from "node:http";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { ReadableStream as NodeWebReadableStream } from "node:stream/web";

export interface Request extends globalThis.Request {}
export interface Response extends globalThis.Response {}
export type Serve = (options: {
  fetch: (req: Request) => Response | Promise<Response>;
  port?: number;
  hostname?: string;
}) => void;
export const serve: Serve = ({ port, hostname, fetch }) => {
  createServer(async (req, res) => {
    const method = req.method;
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/48895
    const headers = req.headers as Record<string, string>;
    const url = `http://${headers.host}${req.url}`;
    const ctrl = new AbortController();
    const signal = ctrl.signal;
    req.once("aborted", () => ctrl.abort());

    const init: RequestInit = {
      method,
      headers,
      signal,
      referrer: headers.referrer,
    };

    if (method !== "GET" && method !== "HEAD") {
      (init as any).duplex = "half";
      init.body = Readable.toWeb(req) as ReadableStream;
    }

    const request = new Request(url, init);
    const response = await fetch(request);
    res.writeHead(response.status, [...response.headers]);

    if (response.body) {
      await pipeline(Readable.fromWeb(response.body as NodeWebReadableStream), res, { signal });
    } else {
      res.end();
    }
  }).listen(port, hostname);
};
