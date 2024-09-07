import { Buffer } from "node:buffer";

const base = "/server/";

const fetchRequestHandler = (request: Request) => {
  const url = request.url;

  if (!url.includes(base)) {
    return;
  }

  const pathname = new URL(url).pathname;

  if (!pathname.startsWith(base)) {
    return;
  }

  const name = pathname.slice(base.length);
  const [_, hexFilepath] = name.split("_");

  const response = Promise.all([import(Buffer.from(hexFilepath, "hex").toString()), request.json()])
    .then(([mod, json]) => mod[name](...json))
    .then(
      (result = null) =>
        new Response(JSON.stringify(result), {
          headers: {
            "Content-Type": "application/json",
          },
        }),
    );

  return response;
};

export default fetchRequestHandler;
