import { Serve } from "./index";

declare const Bun: {
  serve: Serve;
};

export type { Request, Response, Serve } from "./index";
export const serve: Serve = ({ port, hostname, fetch }) => Bun.serve({ port, hostname, fetch });
