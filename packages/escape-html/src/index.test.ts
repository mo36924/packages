import { describe, expect, it } from "vitest";
import { escapeText } from "./index";

describe("escapeText", () => {
  it("should handle empty string", () => {
    expect(escapeText("")).toBe("");
  });

  it("should return unchanged string when no special characters present", () => {
    expect(escapeText("hello world")).toBe("hello world");
  });

  it("should escape single less than symbol", () => {
    expect(escapeText("<")).toBe("&lt;");
  });

  it("should escape single ampersand", () => {
    expect(escapeText("&")).toBe("&amp;");
  });

  it("should escape multiple less than symbols", () => {
    expect(escapeText("a < b < c")).toBe("a &lt; b &lt; c");
  });

  it("should escape multiple ampersands", () => {
    expect(escapeText("a & b & c")).toBe("a &amp; b &amp; c");
  });

  it("should escape mixed special characters", () => {
    expect(escapeText("a < b & c")).toBe("a &lt; b &amp; c");
  });

  it("should handle special characters at string boundaries", () => {
    expect(escapeText("<start>&end")).toBe("&lt;start>&amp;end");
  });

  it("should handle HTML-like content", () => {
    expect(escapeText("<div>&nbsp;</div>")).toBe("&lt;div>&amp;nbsp;&lt;/div>");
  });

  it("should handle consecutive special characters", () => {
    expect(escapeText("<<&&")).toBe("&lt;&lt;&amp;&amp;");
  });

  it("should handle long text with multiple special characters", () => {
    const input = "This is a <test> with multiple & special < characters & more";
    const expected = "This is a &lt;test> with multiple &amp; special &lt; characters &amp; more";
    expect(escapeText(input)).toBe(expected);
  });

  it("should handle special characters with surrounding whitespace", () => {
    expect(escapeText(" < & ")).toBe(" &lt; &amp; ");
  });

  it("should maintain other special characters unchanged", () => {
    expect(escapeText("\"'!@#$%^*()_+")).toBe("\"'!@#$%^*()_+");
  });

  it("should handle unicode characters correctly", () => {
    expect(escapeText("→ < & →")).toBe("→ &lt; &amp; →");
  });
});
