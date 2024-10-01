export const stringify = (value: any) =>
  JSON.stringify(value, function (key, value) {
    if (typeof value !== "string" || this[key] instanceof Date) {
      return value;
    }

    return `${value} `;
  });

export const parse = (text: string) =>
  JSON.parse(text, (_key, value) => {
    if (typeof value !== "string") {
      return value;
    }

    if (value[value.length - 1] === "Z") {
      return new Date(value);
    }

    return value.slice(0, -1);
  });

export const transformer = { serialize: stringify, deserialize: parse };
