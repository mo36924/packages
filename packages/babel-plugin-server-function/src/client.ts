import { parse, stringify } from "@mo36924/json";

export default (id: string, ...args: any[]): Promise<any> =>
  fetch(`/server-function/${id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: stringify(args),
  })
    .then((response) => response.text())
    .then(parse);
