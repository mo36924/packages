import { pascalCase } from "@mo36924/change-case";
import { buildASTSchema, Kind, parse } from "graphql";
import pluralize from "pluralize";
import { getDirectives, printDirectives, TypeDirectives } from "./directives";
import { Field, Fields, sortFields } from "./fields";
import { formatGraphQL } from "./format";
import { isScalarTypeName, scalarTypeNames } from "./scalars";
import { createObject } from "./utils";

export type Types = {
  [typeName: string]: Type;
};

export type Type = {
  name: string;
  directives: TypeDirectives;
  fields: Fields;
};

export const schemaTypeNames = ["Query", "Mutation", "Subscription"] as const;

export type SchemaTypeName = (typeof schemaTypeNames)[number];

export const reservedTypeNames = [...schemaTypeNames, ...scalarTypeNames] as const;

export type ReservedTypeName = (typeof reservedTypeNames)[number];

export const isSchemaTypeName = (name: string): name is SchemaTypeName => schemaTypeNames.includes(name as any);

export const isReservedTypeName = (name: string): name is ReservedTypeName => reservedTypeNames.includes(name as any);

export const getTypeName = (name: string) => {
  const typeName = pascalCase(pluralize.singular(name));
  const upperCaseName = typeName.toUpperCase();

  if (isScalarTypeName(upperCaseName)) {
    return upperCaseName;
  }

  return typeName;
};

export const getJoinTypeName = (name1: string, name2?: string): string => {
  if (name2 != null) {
    return [name1, name2].map(getTypeName).sort().join("To");
  }

  const name = getTypeName(name1);
  const names = name.split("To");
  return names.length === 2 ? getJoinTypeName(names[0], names[1]) : name;
};

const compareType = (a: Type, b: Type) => {
  if (!a.directives.join !== !b.directives.join) {
    return a.directives.join ? 1 : -1;
  }

  if (a.name > b.name) {
    return 1;
  }

  if (a.name < b.name) {
    return -1;
  }

  return 0;
};

export const buildTypes = (graphql: string): Types => {
  const documentNode = parse(graphql);
  const schema = buildASTSchema(documentNode);
  const types = createObject<Types>();

  for (const definition of documentNode.definitions) {
    if (definition.kind !== Kind.OBJECT_TYPE_DEFINITION) {
      continue;
    }

    const fields = createObject<Fields>();

    types[definition.name.value] = {
      name: definition.name.value,
      fields,
      directives: getDirectives(schema, definition),
    };

    for (const fieldDefNode of definition.fields ?? []) {
      const name = fieldDefNode.name;
      let type = fieldDefNode.type;

      const field: Field = (fields[name.value] = {
        name: name.value,
        type: "",
        scalar: false,
        nullable: true,
        list: false,
        directives: getDirectives(schema, fieldDefNode),
      });

      if (type.kind === Kind.NON_NULL_TYPE) {
        type = type.type;
        field.nullable = false;
      }

      if (type.kind === Kind.LIST_TYPE) {
        type = type.type;
        field.nullable = false;
        field.list = true;
      }

      while (type.kind !== Kind.NAMED_TYPE) {
        type = type.type;
      }

      field.type = type.name.value;

      if (isScalarTypeName(field.type)) {
        field.scalar = true;
        field.list = false;
      }
    }
  }

  return types;
};

export const sortTypes = (types: Types): Types =>
  createObject(
    Object.fromEntries(
      Object.entries(types)
        .sort(([, a], [, b]) => compareType(a, b))
        .map(([typeName, type]) => [typeName, { ...type, fields: sortFields(type.fields) }]),
    ),
  );

export const printFieldType = (field: Pick<Field, "type" | "list" | "nullable">): string =>
  `${field.list ? `[${field.type}!]` : field.type}${field.nullable ? "" : "!"}`;

export const printTypes = (types: Types): string => {
  let schema = "";

  for (const { name, directives, fields } of Object.values(types)) {
    schema += `type ${name}${printDirectives(directives)}{`;

    for (const field of Object.values(fields)) {
      schema += `${field.name}:${printFieldType(field)}${printDirectives(field.directives)} `;
    }

    schema += "}";
  }

  return formatGraphQL(schema);
};
