export const stringify = (value: any) =>
  JSON.stringify(value, function (key, value) {
    if (Array.isArray(value)) {
      return [0, ...value];
    }

    if (this[key] instanceof Date) {
      return [1, value];
    }

    return value;
  });

export const parse = (text: string) =>
  JSON.parse(text, (key, value) => {
    if (Array.isArray(value)) {
      if (value[0] === 0) {
        return value.slice(1);
      }

      if (value[0] === 1) {
        return new Date(value[1]);
      }
    }

    return value;
  });
