import { buildSchema as buildGraphQLSchema, GraphQLSchema } from "graphql";
import { printDirectives, schemaDirectives } from "./directives";
import { getFieldName, getListFieldName } from "./fields";
import { formatGraphQL } from "./format";
import { buildModel } from "./model";
import { comparisonOperators } from "./operators";
import { customScalars, mergeCustomScalars, scalarTypeNames } from "./scalars";
import { buildTypes, printFieldType } from "./types";

export const buildSchema = (graphql: string): GraphQLSchema => {
  const model = buildModel(graphql);
  const types = buildTypes(model);
  let schema = customScalars + schemaDirectives;
  let query = "";
  let mutation = "";
  let objectType = "";
  let whereInput = "";
  let orderInput = "";
  let createData = "";
  let updateData = "";
  let deleteData = "";
  let createInput = "";
  let updateInput = "";
  let deleteInput = "";
  const orderEnum = "enum Order {asc desc}";

  query += `type Query {`;

  mutation += `type Mutation {
    create(data: CreateData!): Query!
    update(data: UpdateData!): Query!
    delete(data: DeleteData!): Query!
    read: Query!
  `;

  createData += `input CreateData {`;
  updateData += `input UpdateData {`;
  deleteData += `input DeleteData {`;

  for (const [typeName, type] of Object.entries(types)) {
    const { fields, directives } = type;
    const typeDirectives = printDirectives(directives);
    objectType += `type ${typeName} ${typeDirectives} {`;

    for (const [fieldName, field] of Object.entries(fields)) {
      const { scalar, list, type: fieldTypeName } = field;
      const fieldType = printFieldType(field);
      const fieldDirectives = printDirectives(field.directives);

      if (scalar) {
        objectType += `${fieldName}: ${fieldType} ${fieldDirectives}\n`;
      } else if (list) {
        objectType += `${fieldName}(where: Where${fieldTypeName}, order: Order${fieldTypeName}, limit: Int, offset: Int): ${fieldType} ${fieldDirectives}\n`;
      } else {
        objectType += `${fieldName}(where: Where${fieldTypeName}): ${fieldType} ${fieldDirectives}\n`;
      }
    }

    objectType += `}`;
  }

  for (const [typeName, type] of Object.entries(types)) {
    const { fields, directives } = type;

    if (directives.join) {
      continue;
    }

    const fieldName = getFieldName(typeName);
    const fieldListName = getListFieldName(fieldName);

    query += `
      ${fieldName}(where: Where${typeName}, order: Order${typeName}, offset: Int): ${typeName}
      ${fieldListName}(where: Where${typeName}, order: Order${typeName}, limit: Int, offset: Int): [${typeName}!]!
    `;

    createData += `
      ${fieldName}: CreateData${typeName}
      ${fieldListName}: [CreateData${typeName}!]
    `;

    updateData += `
      ${fieldName}: UpdateData${typeName}
      ${fieldListName}: [UpdateData${typeName}!]
    `;

    deleteData += `
      ${fieldName}: DeleteData${typeName}
      ${fieldListName}: [DeleteData${typeName}!]
    `;

    createInput += `input CreateData${typeName} {`;
    updateInput += `input UpdateData${typeName} {`;
    deleteInput += `input DeleteData${typeName} {`;
    whereInput += `input Where${typeName} {`;
    orderInput += `input Order${typeName} {`;

    for (const [fieldName, field] of Object.entries(fields)) {
      const {
        list,
        type: fieldTypeName,
        scalar,
        directives: { ref },
      } = field;

      if (!scalar) {
        if (list) {
          createInput += `${fieldName}: [CreateData${fieldTypeName}!]\n`;
          updateInput += `${fieldName}: [UpdateData${fieldTypeName}!]\n`;
          deleteInput += `${fieldName}: [DeleteData${fieldTypeName}!]\n`;
        } else {
          createInput += `${fieldName}: CreateData${fieldTypeName}\n`;
          updateInput += `${fieldName}: UpdateData${fieldTypeName}\n`;
          deleteInput += `${fieldName}: DeleteData${fieldTypeName}\n`;
        }

        continue;
      }

      if (!ref) {
        const fieldType = printFieldType(field);

        switch (fieldName) {
          case "id":
            updateInput += `${fieldName}: ${fieldType}\n`;
            deleteInput += `${fieldName}: ${fieldType}\n`;
            break;
          case "version":
            updateInput += `${fieldName}: ${fieldType}\n`;
            deleteInput += `${fieldName}: ${fieldType}\n`;
            break;
          case "createdAt":
          case "updatedAt":
          case "isDeleted":
            break;
          default:
            createInput += `${fieldName}: ${fieldType}\n`;
            updateInput += `${fieldName}: ${printFieldType({ ...field, nullable: true })}\n`;
            break;
        }
      }

      whereInput += `${fieldName}: Where${fieldTypeName}\n`;
      orderInput += `${fieldName}: Order\n`;
    }

    createInput += `}`;
    updateInput += `}`;
    deleteInput += `}`;

    whereInput += `
      and: Where${typeName}
      or: Where${typeName}
      not: Where${typeName}
    }`;

    orderInput += `}`;
  }

  for (const scalarType of scalarTypeNames) {
    whereInput += `input Where${scalarType} {`;

    for (const comparisonOperator of comparisonOperators) {
      if (scalarType === "Boolean" && comparisonOperator !== "eq" && comparisonOperator !== "ne") {
        continue;
      } else if (comparisonOperator === "in") {
        whereInput += `${comparisonOperator}: [${scalarType}]\n`;
      } else if (comparisonOperator === "like") {
        whereInput += `${comparisonOperator}: String\n`;
      } else {
        whereInput += `${comparisonOperator}: ${scalarType}\n`;
      }
    }

    whereInput += `}`;
  }

  query += `}`;
  mutation += `}`;
  createData += `}`;
  updateData += `}`;
  deleteData += `}`;

  schema +=
    query +
    mutation +
    objectType +
    createData +
    updateData +
    deleteData +
    createInput +
    updateInput +
    deleteInput +
    whereInput +
    orderInput +
    orderEnum;

  const formattedSchema = formatGraphQL(schema);
  const graphQLSchema = buildGraphQLSchema(formattedSchema);
  mergeCustomScalars(graphQLSchema);
  return graphQLSchema;
};

export const getSchemaSource = (schema: GraphQLSchema) => {
  const source = schema.getQueryType()?.astNode?.loc?.source.body ?? "";
  return source;
};

export const getSchemaTypes = (schema: GraphQLSchema) => {
  const source = getSchemaSource(schema);
  const types = buildTypes(source);
  return types;
};
