export const Raw = Symbol.for("vitest-snapshot-serializer-raw");

export const wrap = (value: string) => ({ [Raw]: value });
