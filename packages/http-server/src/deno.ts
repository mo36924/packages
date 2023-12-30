import { Serve } from "./index";

declare const Deno: {
  serve: (
    options: { port?: number; hostname?: string },
    hander: (request: Request) => Response | Promise<Response>,
  ) => void;
  env: { get: (key: string) => string | undefined };
};

export type { Request, Response, Serve } from "./index";
export const serve: Serve = ({ port = Number(Deno.env.get("PORT")) || 3000, hostname, fetch }) =>
  Deno.serve({ port, hostname }, fetch);
