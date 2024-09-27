import {
  getNamedType,
  getNullableType,
  GraphQLInputField,
  GraphQLSchema,
  isInputObjectType,
  isListType,
  isNonNullType,
  isScalarType,
} from "graphql";
import { ScalarTypeName } from "./scalars";
import { createObject } from "./utils";

const types: Record<string, string> = createObject({
  ID: "string",
  String: "string",
  Int: "number",
  Float: "number",
  Boolean: "boolean",
  Date: "Date",
  JSON: "object",
} satisfies Record<ScalarTypeName, string>);

const getFieldType = (field: GraphQLInputField) => {
  const { type, name } = field;
  const isNonNull = isNonNullType(type);
  const nullableType = getNullableType(type);
  const isList = isListType(nullableType);
  const namedType = getNamedType(nullableType);
  const isScalar = isScalarType(namedType);
  const fieldType = namedType.name;
  const typescriptType = isScalar ? types[fieldType] : fieldType;
  return `${name}${isNonNull ? "" : "?"}:${typescriptType}${isList ? "[]" : ""}${isNonNull ? "" : "|null"}\n`;
};

export const buildDeclaration = (schema: GraphQLSchema) => {
  let declaration = "export type {}\ndeclare global {\nnamespace GraphQL {\n";

  for (const type of Object.values(schema.getTypeMap())) {
    if (isInputObjectType(type)) {
      declaration += `export type ${type.name} = {\n`;

      for (const field of Object.values(type.getFields())) {
        declaration += getFieldType(field);
      }

      declaration += "}\n";
    }
  }

  declaration += "}}";

  return declaration;
};
