import { camelCase } from "@mo36924/change-case";
import { getTypes, isSchemaTypeName, ScalarTypeName } from "@mo36924/graphql";
import { GraphQLSchema } from "graphql";

const types: Record<ScalarTypeName, string> = {
  ID: "text",
  Int: "integer",
  Float: "real",
  String: "text",
  Boolean: "integer",
  Date: "integer",
  JSON: "text",
};

const configs: Record<ScalarTypeName, string> = {
  ID: "",
  Int: "{ mode: 'number' }",
  Float: "",
  String: "",
  Boolean: "{ mode: 'boolean' }",
  Date: "{ mode: 'timestamp_ms' }",
  JSON: "{ mode: 'json' }",
};

export const buildDrizzleSchema = (schema: GraphQLSchema) => {
  const schemaTypes = getTypes(schema);
  let code = "";

  for (const [typeName, type] of Object.entries(schemaTypes)) {
    if (isSchemaTypeName(typeName)) {
      continue;
    }

    const {
      fields,
      directives: { join: joinDirective },
    } = type;

    let columns = "";
    let indexes = "";
    let relations = "";

    for (const [fieldName, field] of Object.entries(fields)) {
      const {
        type: fieldTypeName,
        nullable,
        scalar,
        list,
        directives: {
          ref: refDirective,
          unique: uniqueDirective,
          key: keyDirective,
          field: fieldDirective,
          type: typeDirective,
        },
      } = field;

      if (scalar) {
        const type = types[fieldTypeName as ScalarTypeName];
        const config = configs[fieldTypeName as ScalarTypeName];

        let column = `${fieldName}: ${type}("${fieldName}", ${config})`;

        if (!nullable) {
          column += ".notNull()";
        }

        if (fieldName === "id") {
          column += `.primaryKey().$default(randomId)`;
        } else if (fieldName === "createdAt") {
          column += `.$default(() => new Date())`;
        } else if (fieldName === "updatedAt") {
          column += `.$onUpdate(() => new Date())`;
        }

        columns += `${column},`;

        if (uniqueDirective) {
          indexes += `${fieldName}: uniqueIndex("${typeName}_${fieldName}").on(table.${fieldName}),`;
        } else if (refDirective) {
          indexes += `${fieldName}: index("${typeName}_${fieldName}").on(table.${fieldName}),`;
        }

        if (joinDirective && refDirective) {
          relations += `${camelCase(refDirective.name)}: one(${refDirective.name}, { fields: [${typeName}.${fieldName}], references: [${refDirective.name}.id] }),`;
        }
      } else {
        if (keyDirective) {
          relations += `${fieldName}: one(${fieldTypeName}, { fields: [${typeName}.${keyDirective.name}], references: [${fieldTypeName}.id] }),`;
        } else if (fieldDirective) {
          relations += `${fieldName}: ${list ? "many" : "one"}(${fieldTypeName}),`;
        } else if (typeDirective) {
          relations += `${camelCase(typeDirective.name)}: many(${typeDirective.name}),`;
        }
      }
    }

    code += `export const ${typeName} = sqliteTable("${typeName}", {\n${columns}}, ${indexes ? `(table) => ({\n${indexes}})` : ""});\n\n`;

    if (relations) {
      code += `export const ${typeName}Relations = relations(${typeName}, ({ ${["many", "one"].filter((relation) => relations.includes(`${relation}(`))} }) => ({\n${relations}}));\n\n`;
    }
  }

  code = `
    import { relations } from "drizzle-orm";
    import { sqliteTable, uniqueIndex, index, ${Object.values(types)} } from "drizzle-orm/sqlite-core";
    import { randomId } from "@mo36924/random-id";

    ${code}
  `;

  return code;
};
