import { stringify } from "@mo36924/json";

const basePath = "/server/";
const basePathLength = basePath.length;

const createResponse = (data = null) =>
  new Response(stringify(data), {
    headers: {
      "Content-Type": "application/json",
    },
  });

const fetchRequestHandler = (request: Request) => {
  const url = request.url;

  if (!url.includes(basePath)) {
    return;
  }

  const pathname = new URL(url).pathname;

  if (!pathname.startsWith(basePath)) {
    return;
  }

  const id = pathname.slice(basePathLength);

  // eslint-disable-next-line node/prefer-global/process
  if (process.env.NODE_ENV !== "production") {
    const [_, hexFilepath] = id.split("_");

    // eslint-disable-next-line node/prefer-global/buffer
    const response = Promise.all([import(Buffer.from(hexFilepath, "hex").toString()), request.json()])
      .then(([mod, data]) => mod[id](...data))
      .then(createResponse);

    return response;
  }

  // @ts-expect-error serverFunction is translated by babel
  const serverFunction = (serverFunctions as { [id: string]: (...args: any[]) => Promise<any> })[id];

  if (!serverFunction) {
    return;
  }

  const response = request
    .json()
    .then((data) => serverFunction(...data))
    .then(createResponse);

  return response;
};

export default fetchRequestHandler;
