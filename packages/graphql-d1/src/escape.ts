export const identifier = (value: string) => `"${value.replaceAll('"', '""')}"`;

export const literal = (value: string | number | boolean | Date | null | undefined) => {
  if (value == null) {
    return "null";
  }

  switch (typeof value) {
    case "boolean":
    case "number":
      return value.toString();
    case "object":
      if (value instanceof Date) {
        return value.getTime().toString();
      }

      value = String(value);
  }

  value = `'${value.replaceAll("'", "''")}'`;

  return value;
};
