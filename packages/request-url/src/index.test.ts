import { describe, expect, it } from "vitest";
import { getRequestURL } from "./index";

describe("getRequestURL", () => {
  it("should return URL object for the request", () => {
    const request = new Request("https://example.com/path?query=test");
    const url = getRequestURL(request);
    expect(url).toBeInstanceOf(URL);
    expect(url.href).toBe("https://example.com/path?query=test");
  });

  it("should cache URL object on subsequent calls", () => {
    const request = new Request("https://example.com/path?query=test");
    const firstUrl = getRequestURL(request);
    const secondUrl = getRequestURL(request);
    expect(firstUrl).toBe(secondUrl);
  });

  it("should handle different request URLs", () => {
    const request1 = new Request("https://example.com/path1");
    const request2 = new Request("https://example.com/path2");

    const url1 = getRequestURL(request1);
    const url2 = getRequestURL(request2);

    expect(url1.pathname).toBe("/path1");
    expect(url2.pathname).toBe("/path2");
  });
});
