import { parse, stringify } from "@mo36924/json";
import { basePathname } from "./constants";

export type Client = (id: string, ...args: any[]) => Promise<any>;

const client: Client = (id: string, ...args: any[]) =>
  fetch(basePathname + id, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: stringify(args),
  })
    .then((response) => response.text())
    .then(parse);

export default client;
