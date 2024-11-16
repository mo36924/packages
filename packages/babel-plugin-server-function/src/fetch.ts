import { stringify } from "@mo36924/json";
import { BASE_PATHNAME } from "./constants";
import { hexToText } from "./utils";

// __SERVER_FUNCTIONS__ is set to a value by Babel
const __SERVER_FUNCTIONS__: { [id: string]: (...args: any[]) => Promise<any> } | undefined = undefined as any;

const basePathLength = BASE_PATHNAME.length;

const createResponse = (data = null) =>
  new Response(stringify(data), {
    headers: {
      "Content-Type": "application/json",
    },
  });

const fetchRequestHandler = (request: Request) => {
  const url = request.url;

  if (!url.includes(BASE_PATHNAME)) {
    return;
  }

  const pathname = new URL(url).pathname;

  if (!pathname.startsWith(BASE_PATHNAME)) {
    return;
  }

  const id = pathname.slice(basePathLength);

  if (!__SERVER_FUNCTIONS__) {
    const [_, hexFilepath] = id.split("_");

    const response = Promise.all([import(hexToText(hexFilepath)), request.json()])
      .then(([mod, args]) => mod[id](...args))
      .then(createResponse);

    return response;
  }

  const serverFunction = __SERVER_FUNCTIONS__[id];

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
