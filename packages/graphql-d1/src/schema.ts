import { createObject, getTypes, isSchemaTypeName, ScalarTypeName } from "@mo36924/graphql";
import { GraphQLSchema } from "graphql";
import { identifier } from "./escape";

export const buildSchema = (schema: GraphQLSchema) => {
  const types = getTypes(schema);
  const create: string[] = [];
  const unique: string[] = [];
  const index: string[] = [];

  const dbTypes = createObject<Record<ScalarTypeName, string>>({
    ID: "text",
    Int: "integer",
    Float: "real",
    String: "text",
    Boolean: "integer",
    Date: "integer",
    JSON: "text",
  });

  for (const [typeName, type] of Object.entries(types)) {
    if (isSchemaTypeName(typeName)) {
      continue;
    }

    const { fields } = type;
    const columns: string[] = [];

    for (const [fieldName, field] of Object.entries(fields)) {
      const {
        type: fieldTypeName,
        nullable,
        scalar,
        directives: { ref: refDirective, unique: uniqueDirective },
      } = field;

      if (scalar) {
        const dbType = dbTypes[fieldTypeName as ScalarTypeName];

        if (fieldName === "id") {
          columns.push(`${identifier(fieldName)} ${dbType} not null primary key`);
        } else {
          columns.push(`${identifier(fieldName)} ${dbType}${nullable ? "" : " not null"}`);
        }
      }

      if (uniqueDirective) {
        unique.push(
          `create unique index ${identifier(`${typeName}_${fieldName}`)} on ${identifier(typeName)} (${identifier(fieldName)});\n`,
        );
      } else if (refDirective) {
        index.push(
          `create index ${identifier(`${typeName}_${fieldName}`)} on ${identifier(typeName)} (${identifier(fieldName)});\n`,
        );
      }
    }

    create.push(`create table ${identifier(typeName)} (${columns});\n`);
  }

  return [create, unique, index].flat().join("");
};
