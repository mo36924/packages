import { parse } from "cookie";

const cookieSymbol = Symbol("cookie");

export const getRequestCookies = <
  T extends Record<string, string | undefined> = Record<string, string | undefined>,
>(request: {
  headers: Headers;
  [cookieSymbol]?: T;
}): T => {
  let cookies = request[cookieSymbol];

  if (!cookies) {
    const cookie = request.headers.get("cookie");

    if (cookie) {
      cookies = parse(cookie) as T;
    } else {
      cookies = {} as T;
    }

    request[cookieSymbol] = cookies;
  }

  return cookies;
};
