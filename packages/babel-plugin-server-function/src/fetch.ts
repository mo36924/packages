import { stringify } from "@mo36924/json";
import { basePathname, basePathnameLength } from "./constants";
import { functions } from "./functions";

const createResponse = (data = null) =>
  new Response(stringify(data), {
    headers: {
      "Content-Type": "application/json",
    },
  });

const fetchRequestHandler = (request: Request) => {
  const url = request.url;

  if (!url.includes(basePathname)) {
    return;
  }

  const pathname = new URL(url).pathname;

  if (!pathname.startsWith(basePathname)) {
    return;
  }

  const id = pathname.slice(basePathnameLength);

  const serverFunction = functions[id];

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
