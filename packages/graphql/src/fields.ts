import { camelCase } from "@mo36924/change-case";
import {
  getNamedType,
  getNullableType,
  GraphQLError,
  GraphQLSchema,
  isListType,
  isNullableType,
  isObjectType,
  isScalarType,
} from "graphql";
import pluralize from "pluralize";
import { FieldDirectives, getDirectives } from "./directives";
import { logicalOperators } from "./operators";
import { createObject, memoize3 } from "./utils";

export type Fields = {
  [fieldName: string]: Field;
};

export type Field = {
  name: string;
  type: string;
  scalar: boolean;
  nullable: boolean;
  list: boolean;
  directives: FieldDirectives;
};

export const baseType = /* GraphQL */ `
  type BaseType {
    id: String!
    createdAt: Date!
    updatedAt: Date!
  }
`;

export const baseFieldNames = ["id", "createdAt", "updatedAt"] as const;

export type BaseFieldName = (typeof baseFieldNames)[number];

export const isBaseFieldName = (type: string): type is BaseFieldName => baseFieldNames.includes(type as BaseFieldName);

export const reservedFieldNames = [...baseFieldNames, ...logicalOperators] as const;

export type ReservedFieldName = (typeof reservedFieldNames)[number];

export const isReservedFieldName = (name: string): name is ReservedFieldName =>
  reservedFieldNames.includes(name as any);

export const getFieldName = (name: string) => camelCase(pluralize.singular(name));

export const getListFieldName = (name: string) => camelCase(pluralize.plural(name));

export const getKeyFieldName = (name: string) => getFieldName(name).replace(/(Id)*$/, "Id");

export const getKeyFieldNames = (name1: string, name2: string): [string, string] => [
  getKeyFieldName(name1),
  getKeyFieldName(name2),
];

const compareField = ({ name: a }: Field, { name: b }: Field) => {
  let indexA = baseFieldNames.indexOf(a as any);
  let indexB = baseFieldNames.indexOf(b as any);
  indexA = indexA === -1 ? baseFieldNames.length : indexA;
  indexB = indexB === -1 ? baseFieldNames.length : indexB;

  if (indexA !== indexB) {
    return indexA - indexB;
  }

  if (a > b) {
    return 1;
  }

  if (a < b) {
    return -1;
  }

  return 0;
};

export const sortFields = (fields: Fields) =>
  createObject(Object.fromEntries(Object.entries(fields).sort((a, b) => compareField(a[1], b[1]))));

export const getFieldDef = memoize3((schema: GraphQLSchema, type: string, field: string) => {
  const objectType = schema.getType(type);

  if (!isObjectType(objectType)) {
    throw new GraphQLError(`${type} is not an object type`);
  }

  const def = objectType.getFields()[field];
  const name = field;
  const fieldType = def.type;
  const nullable = isNullableType(fieldType);
  const nullableType = getNullableType(fieldType);
  const list = isListType(nullableType);
  const namedType = getNamedType(nullableType);
  const scalar = isScalarType(namedType);
  const _type = namedType.name;
  const directives = getDirectives(schema, def.astNode!);
  const _isBaseFieldName = isBaseFieldName(name);
  return {
    schema,
    parent: type,
    def,
    name,
    type: _type,
    scalar,
    list,
    nullable,
    directives,
    isBaseFieldName: _isBaseFieldName,
  };
});
