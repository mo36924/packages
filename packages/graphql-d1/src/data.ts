import { buildData as buildDatabaseData } from "@mo36924/graphql";
import { GraphQLSchema } from "graphql";
import { identifier, literal } from "./escape";

export const buildData = (schema: GraphQLSchema) => {
  const data = buildDatabaseData(schema);
  let sql = "";

  for (const { name, fields, values } of data) {
    const table = identifier(name);
    const columns = fields.map(identifier);

    const _values = values.map((v) => v.map(({ value }) => literal(value))).map((v) => `(${v})`);

    sql += `insert into ${table} (${columns}) values ${_values};\n`;
  }

  return sql;
};
