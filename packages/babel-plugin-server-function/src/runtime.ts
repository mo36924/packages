export type Runtime = (id: string) => (...args: any[]) => Promise<any>;

const runtime: Runtime =
  (id: string) =>
  (...args: any[]) =>
    fetch(`/server/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    }).then((response) => response.json());

export default runtime;
