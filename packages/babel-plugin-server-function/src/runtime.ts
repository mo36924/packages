import { parse, stringify } from "@mo36924/json";

export type Runtime = (id: string) => (...args: any[]) => Promise<any>;

const runtime: Runtime =
  (id: string) =>
  (...args: any[]) =>
    fetch(`/server/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: stringify(args),
    })
      .then((response) => response.text())
      .then(parse);

export default runtime;
