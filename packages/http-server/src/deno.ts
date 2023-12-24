import { Serve } from "./index";

declare const Deno: {
  serve: (
    options: { port?: number; hostname?: string },
    hander: (request: Request) => Response | Promise<Response>,
  ) => void;
};

export type { Request, Response, Serve } from "./index";
export const serve: Serve = ({ port, hostname, fetch }) => Deno.serve({ port, hostname }, fetch);
