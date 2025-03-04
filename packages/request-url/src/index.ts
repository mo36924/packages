const urlSymbol = Symbol("url");

export const getRequestURL = (request: { url: string; [urlSymbol]?: URL }): URL =>
  (request[urlSymbol] ??= new URL(request.url));
