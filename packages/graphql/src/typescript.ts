import {
  getNamedType,
  getNullableType,
  GraphQLInputField,
  GraphQLSchema,
  isInputObjectType,
  isListType,
  isNonNullType,
  isNullableType,
  isScalarType,
  NoUndefinedVariablesRule,
  parse,
  specifiedRules,
  TypeInfo,
  validate,
  visit,
  visitWithTypeInfo,
} from "graphql";
import ts from "typescript";
import { format } from "./format";
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

const validationRules = specifiedRules.filter((rule) => rule !== NoUndefinedVariablesRule);

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

export const buildDeclaration = (path: string, schema: GraphQLSchema) => {
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

  return format(path, declaration);
};

export const getGqlTypeArguments = (schema: GraphQLSchema, node: ts.TaggedTemplateExpression) => {
  const { template } = node;
  let query = "";

  if (ts.isNoSubstitutionTemplateLiteral(template)) {
    query += template.text;
  } else {
    query += template.head.text;

    template.templateSpans.forEach((span, i) => {
      query += `$_${i}${span.literal.text}`;
    });
  }

  let documentNode;

  try {
    documentNode = parse(query);
  } catch {
    return "";
  }

  const definition = documentNode.definitions[0];

  if (definition.kind !== "OperationDefinition") {
    return "";
  }

  let operation = "query";
  const field = definition.selectionSet.selections[0];

  if (field.kind === "Field" && schema.getMutationType()?.getFields()[field.name.value]) {
    operation = "muation";
    /// @ts-expect-error ignore readonly
    definition.operation = operation;
  }

  const errors = validate(schema, documentNode, validationRules);

  if (errors.length) {
    return "";
  }

  const typeInfo = new TypeInfo(schema);
  const values: string[] = [];

  const data: string = visit<any>(
    definition,
    visitWithTypeInfo(typeInfo, {
      Variable() {
        const inputType = typeInfo.getInputType();
        const nullableType = getNullableType(inputType);
        const namedType = getNamedType(nullableType)!;
        let type = types[namedType.name] ?? `GraphQL.${namedType.name}`;

        if (isListType(nullableType)) {
          type = `${type}[]`;
        }

        if (isNullableType(inputType)) {
          type = `${type}|null`;
        }

        values.push(type);
      },
      OperationDefinition: {
        leave(node) {
          return node.selectionSet as any;
        },
      },
      SelectionSet: {
        leave(node) {
          return `{${node.selections}}`;
        },
      },
      Field: {
        leave(node) {
          const fieldName = (node.alias || node.name).value;
          const outputType = typeInfo.getType();
          const nullableType = getNullableType(outputType);
          const namedType = getNamedType(outputType)!;
          let type = "";

          if (isScalarType(namedType)) {
            type = types[namedType.name];
          } else {
            type = node.selectionSet as any;
          }

          if (isListType(nullableType)) {
            type = `${type}[]`;
          }

          if (isNullableType(outputType)) {
            type = `${type}|null`;
          }

          return `${fieldName}:${type}`;
        },
      },
    }),
  );

  return `<{values:[${values}],data:${data},operation:"${operation}"}>`;
};
