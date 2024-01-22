import { serve as nodeServer } from "@hono/node-server";

// eslint-disable-next-line ts/consistent-type-definitions
export interface Request extends globalThis.Request {}
// eslint-disable-next-line ts/consistent-type-definitions
export interface Response extends globalThis.Response {}
export type Serve = (options: {
  fetch: (request: Request) => Response | Promise<Response>;
  port?: number;
  hostname?: string;
}) => void;
export const serve: Serve = nodeServer;
