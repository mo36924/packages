import { getSchema } from "./config";

export const { schema } = getSchema();

declare global {
  const gql: <
    T extends { values: any[]; data: any; operation: any } = { values: never[]; data: never; operation: never },
  >(
    strings: TemplateStringsArray,
    ...values: T["values"]
  ) => { query: string; variables?: Record<string, any>; _data: T["data"]; _operation: T["operation"] };
}
