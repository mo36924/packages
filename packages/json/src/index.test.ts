import { describe, expect, it } from "vitest";
import { parse, stringify } from "./index";

describe("json transformer", () => {
  it("should handle undefined values", () => {
    const serialized = stringify(undefined);
    const deserialized = parse(serialized);
    expect(deserialized).toBe(null);
  });

  it("should handle basic string values", () => {
    const input = "hello";
    const serialized = stringify(input);
    const deserialized = parse(serialized);
    expect(deserialized).toBe(input);
  });

  it("should handle Date objects", () => {
    const input = new Date("2023-01-01");
    const obj = { date: input };
    const serialized = stringify(obj);
    const deserialized = parse(serialized);
    expect(deserialized.date instanceof Date).toBe(true);
    expect(deserialized.date.getTime()).toBe(input.getTime());
  });

  it("should handle nested objects with mixed types", () => {
    const input = { name: "test", date: new Date("2023-01-01"), nested: { text: "nested", number: 42 } };

    const serialized = stringify(input);
    const deserialized = parse(serialized);
    expect(deserialized.name).toBe(input.name);
    expect(deserialized.date instanceof Date).toBe(true);
    expect(deserialized.nested.text).toBe(input.nested.text);
    expect(deserialized.nested.number).toBe(input.nested.number);
  });

  it("should handle arrays", () => {
    const input = ["hello", new Date("2023-01-01"), 123];
    const serialized = stringify(input);
    const deserialized = parse(serialized);
    expect(deserialized[0]).toBe(input[0]);
    expect(deserialized[1] instanceof Date).toBe(true);
    expect(deserialized[2]).toBe(input[2]);
  });
});
