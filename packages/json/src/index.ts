export const stringify = (value: any) =>
  JSON.stringify(value, function (key, value) {
    if (typeof value !== "string") {
      return value;
    }

    if (this[key] instanceof Date) {
      return `1${value}`;
    }

    return `0${value}`;
  });

export const parse = (text: string) =>
  JSON.parse(text, (_key, value) => {
    if (typeof value !== "string") {
      return value;
    }

    if (value[0] === "1") {
      return new Date(value.slice(1));
    }

    return value.slice(1);
  });

export const transformer = { serialize: stringify, deserialize: parse };
