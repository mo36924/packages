import { camelCase } from "@mo36924/change-case";
import pluralize from "pluralize";
import { FieldDirectives } from "./directives";
import { logicalOperators } from "./operators";
import { createObject } from "./utils";

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
