import { camelCase, pascalCase } from "change-case";
import {
  FieldDefinitionNode,
  GraphQLSchema,
  Kind,
  ObjectTypeDefinitionNode,
  buildASTSchema,
  getArgumentValues,
  parse as parseGraphQLSource,
  print as printGraphQLSource,
  stripIgnoredCharacters,
} from "graphql";
import pluralize from "pluralize";
import { UnionToIntersection } from "type-fest";

const { singular, plural } = pluralize;

type Types = {
  [typeName: string]: Type;
};
type Type = {
  name: string;
  directives: TypeDirectives;
  fields: Fields;
};
type Fields = {
  [fieldName: string]: Field;
};
type Field = {
  name: string;
  type: string;
  scalar: boolean;
  nullable: boolean;
  list: boolean;
  directives: FieldDirectives;
};
type TypeDirectives = {
  join?: object;
};
type FieldDirectives = {
  field?: { name: string; key: string };
  type?: { name: string; keys: [string, string] };
  key?: { name: string };
  ref?: { name: string };
  unique?: object;
};
type CustomScalarTypeName = (typeof customScalarTypeNames)[number];
type ScalarTypeName = (typeof scalarTypeNames)[number];
type ReservedTypeName = (typeof reservedTypeNames)[number];
type ReservedFieldName = (typeof reservedFieldNames)[number];

const primaryKeyTypeName = "ID";
const customScalarTypeNames = ["Date", "JSON"] as const;
const scalarTypeNames = ["ID", "Int", "Float", "String", "Boolean", ...customScalarTypeNames] as const;
const comparisonOperators = ["eq", "ne", "gt", "lt", "ge", "le", "in", "like"] as const;
const logicalOperators = ["not", "and", "or"] as const;
const schemaTypeNames = ["Query", "Mutation", "Subscription"] as const;
const reservedTypeNames = [...schemaTypeNames, ...scalarTypeNames] as const;
const baseFieldNames = ["id", "version", "createdAt", "updatedAt"] as const;
const reservedFieldNames = [...baseFieldNames, ...logicalOperators] as const;

const baseType = /* GraphQL */ `
  type BaseType {
    id: ID!
    version: Int!
    createdAt: Date!
    updatedAt: Date!
  }
`;

const customScalars = /* GraphQL */ `
  scalar Date
  scalar JSON
`;

// eslint-disable-next-line unused-imports/no-unused-vars
const modelDirectives = /* GraphQL */ `
  directive @field(name: String!) on FIELD_DEFINITION
  directive @type(name: String!) on FIELD_DEFINITION
`;

const schemaDirectives = /* GraphQL */ `
  directive @join on OBJECT
  directive @unique on FIELD_DEFINITION
  directive @key(name: String!) on FIELD_DEFINITION
  directive @ref(name: String!) on FIELD_DEFINITION
  directive @field(name: String!, key: String!) on FIELD_DEFINITION
  directive @type(name: String!, keys: [String!]!) on FIELD_DEFINITION
`;

export const createObject = <T extends object, U extends object[] = object[]>(
  ...sources: U
): UnionToIntersection<T | U[number]> => Object.assign(Object.create(null), ...sources);

// eslint-disable-next-line unused-imports/no-unused-vars
const isCustomScalarTypeName = (type: string): type is CustomScalarTypeName =>
  customScalarTypeNames.includes(type as CustomScalarTypeName);

const isScalarTypeName = (name: string): name is ScalarTypeName => scalarTypeNames.includes(name as any);
const isReservedTypeName = (name: string): name is ReservedTypeName => reservedTypeNames.includes(name as any);
const isReservedFieldName = (name: string): name is ReservedFieldName => reservedFieldNames.includes(name as any);

const getTypeName = (name: string) => {
  const typeName = pascalCase(singular(name));
  const upperCaseName = typeName.toUpperCase();

  if (isScalarTypeName(upperCaseName)) {
    return upperCaseName;
  }

  return typeName;
};

const getJoinTypeName = (name1: string, name2?: string): string => {
  if (name2 != null) {
    return [name1, name2].map(getTypeName).sort().join("To");
  }

  const name = getTypeName(name1);
  const names = name.split("To");
  return names.length === 2 ? getJoinTypeName(names[0], names[1]) : name;
};

const getFieldName = (name: string) => camelCase(singular(name));
const getListFieldName = (name: string) => camelCase(plural(name));
const getKeyFieldName = (name: string) => getFieldName(name).replace(/(Id)*$/, "Id");

const getKeyFieldNames = (name1: string, name2: string): [string, string] => [
  getKeyFieldName(name1),
  getKeyFieldName(name2),
];

const getDirectives = <T extends ObjectTypeDefinitionNode | FieldDefinitionNode>(
  schema: GraphQLSchema,
  node: T,
): T extends ObjectTypeDefinitionNode ? TypeDirectives : FieldDirectives =>
  node.directives!.reduce((directives, directive) => {
    directives[directive.name.value] = getArgumentValues(schema.getDirective(directive.name.value)!, directive);
    return directives;
  }, Object.create(null));

const format = (source: string) => printGraphQLSource(parseGraphQLSource(stripIgnoredCharacters(source)));

// eslint-disable-next-line unused-imports/no-unused-vars
const clone = (types: Types): Types =>
  JSON.parse(JSON.stringify(types), (_key, value) =>
    value && typeof value === "object" && !Array.isArray(value) ? createObject(value) : value,
  );

export const parse = (source: string): Types => {
  const documentNode = parseGraphQLSource(source);
  const graphQLSchema = buildASTSchema(documentNode);
  const types: Types = Object.create(null);

  for (const definition of documentNode.definitions) {
    if (definition.kind !== Kind.OBJECT_TYPE_DEFINITION) {
      continue;
    }

    const fields: Fields = Object.create(null);

    types[definition.name.value] = {
      name: definition.name.value,
      fields,
      directives: getDirectives(graphQLSchema, definition),
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
        directives: getDirectives(graphQLSchema, fieldDefNode),
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

const printDirectives = (directives: TypeDirectives | FieldDirectives): string => {
  let _directives = "";

  for (const [name, args] of Object.entries(directives)) {
    if (args == null) {
      continue;
    }

    const entries = Object.entries(args);

    if (entries.length === 0) {
      _directives += `@${name}`;
      continue;
    }

    _directives += `@${name}(`;

    for (const [name, value] of entries) {
      _directives += `${name}:${JSON.stringify(value)} `;
    }

    _directives += `)`;
  }

  return _directives;
};

const printFieldType = (field: Pick<Field, "type" | "list" | "nullable">): string =>
  `${field.list ? `[${field.type}!]` : field.type}${field.nullable ? "" : "!"}`;

// eslint-disable-next-line unused-imports/no-unused-vars
const print = (types: Types): string => {
  let source = "";

  for (const { name, directives, fields } of Object.values(types)) {
    source += `type ${name}${printDirectives(directives)}{`;

    for (const field of Object.values(fields)) {
      source += `${field.name}:${printFieldType(field)}${printDirectives(field.directives)} `;
    }

    source += "}";
  }

  return format(source);
};

export const sort = (types: Types): Types =>
  Object.fromEntries(
    Object.entries(types)
      .sort(([, a], [, b]) => {
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
      })
      .map(([typeName, type]) => [
        typeName,
        {
          ...type,
          fields: Object.fromEntries(
            Object.entries(type.fields).sort(([, a], [, b]) => {
              let indexA = baseFieldNames.indexOf(a.name as any);
              let indexB = baseFieldNames.indexOf(b.name as any);
              indexA = indexA === -1 ? baseFieldNames.length : indexA;
              indexB = indexB === -1 ? baseFieldNames.length : indexB;

              if (indexA !== indexB) {
                return indexA - indexB;
              }

              if (a.name > b.name) {
                return 1;
              }

              if (a.name < b.name) {
                return -1;
              }

              return 0;
            }),
          ),
        },
      ]),
  );

export const fix = (types: Types) => {
  const joinTypeNameSet = new Set<string>();
  const renameJoinTypeFields: Field[] = [];

  for (let [typeName, type] of Object.entries(types)) {
    delete types[typeName];
    typeName = getTypeName(typeName);

    if (isReservedTypeName(typeName)) {
      continue;
    }

    const { fields } = (types[typeName] = { ...type, name: typeName, directives: {} });

    for (let [fieldName, field] of Object.entries(fields)) {
      delete fields[fieldName];
      const { type, scalar, list, directives } = field;
      fieldName = (list ? getListFieldName : getFieldName)(fieldName);

      if (isReservedFieldName(fieldName)) {
        continue;
      }

      const fieldType = getTypeName(type);
      field = fields[fieldName] = { ...field, name: fieldName, type: fieldType };

      if (scalar) {
        field.directives = {};
      } else if (directives.field) {
        if (!list) {
          field.nullable = true;
        }

        directives.field.name = getFieldName(directives.field.name);
      } else if (directives.type && list) {
        let joinTypeName: string;

        if (getTypeName(fieldName) === fieldType) {
          joinTypeName = getJoinTypeName(typeName, fieldType);
        } else {
          joinTypeName = getJoinTypeName(directives.type.name);
          renameJoinTypeFields.push(field);
        }

        joinTypeNameSet.add(joinTypeName);
        directives.type.name = joinTypeName;
      }
    }
  }

  for (let i = 0, len = renameJoinTypeFields.length; i < len; i++) {
    const _renameJoinTypeFields = [renameJoinTypeFields[i]];

    for (let j = i + 1; j < len; j++) {
      if (renameJoinTypeFields[i].directives.type!.name === renameJoinTypeFields[j].directives.type!.name) {
        _renameJoinTypeFields.push(renameJoinTypeFields[j]);
      }
    }

    if (_renameJoinTypeFields.length === 2) {
      const joinTypeName = getJoinTypeName(_renameJoinTypeFields[0].name, _renameJoinTypeFields[1].name);
      joinTypeNameSet.add(joinTypeName);
      _renameJoinTypeFields[0].directives.type!.name = _renameJoinTypeFields[1].directives.type!.name = joinTypeName;
    }
  }

  for (const type of Object.keys(types)) {
    const joinTypeName = getJoinTypeName(type);

    if (joinTypeNameSet.has(joinTypeName)) {
      delete types[type];
    }
  }

  return types;
};

export const relation = (types: Types) => {
  for (const [typeName, type] of Object.entries(types)) {
    const fields = (type.fields = createObject(type.fields));

    for (const [fieldName, field] of Object.entries(fields)) {
      if (field.scalar) {
        continue;
      }

      const directives = field.directives;
      const { key: keyDirective, type: typeDirective, field: fieldDirective } = directives;

      if (keyDirective) {
        continue;
      }

      if (typeDirective) {
        typeDirective.keys = getKeyFieldNames(typeName, field.type);
        const joinTypeName = typeDirective.name;

        if (types[joinTypeName]) {
          continue;
        }

        const typeNames = [typeName, field.type].sort();
        const keys = getKeyFieldNames(typeNames[0], typeNames[1]);

        types[joinTypeName] = {
          name: joinTypeName,
          directives: { join: {} },
          fields: createObject({
            [keys[0]]: {
              name: keys[0],
              type: primaryKeyTypeName,
              list: false,
              nullable: false,
              scalar: true,
              directives: {
                ref: { name: typeNames[0] },
              },
            },
            [keys[1]]: {
              name: keys[1],
              type: primaryKeyTypeName,
              list: false,
              nullable: false,
              scalar: true,
              directives: {
                ref: { name: typeNames[1] },
              },
            },
          }),
        };

        continue;
      }

      if (fieldDirective) {
        const refTypeFieldName = fieldDirective.name;
        const refTypeFields = types[field.type].fields;
        const keyFieldName = getKeyFieldName(refTypeFieldName);
        fieldDirective.key = keyFieldName;

        if (refTypeFields[keyFieldName]?.directives.ref) {
          continue;
        }

        const nullable = refTypeFields[refTypeFieldName]?.nullable ?? true;

        refTypeFields[refTypeFieldName] = {
          name: refTypeFieldName,
          type: typeName,
          list: false,
          nullable,
          scalar: false,
          directives: {
            key: {
              name: keyFieldName,
            },
          },
        };

        refTypeFields[keyFieldName] = {
          name: keyFieldName,
          type: primaryKeyTypeName,
          list: false,
          nullable,
          scalar: true,
          directives: {
            ref: { name: typeName },
            ...(field.list ? {} : { unique: {} }),
          },
        };

        continue;
      }

      if (getTypeName(fieldName) !== field.type) {
        continue;
      }

      const refTypeName = field.type;
      const refType = types[refTypeName];
      const refTypeFields = refType.fields;
      const refListField = refTypeFields[getListFieldName(typeName)];
      const fieldIsList = field.list;
      const refFieldIsList = refListField?.list ?? false;

      // *:*
      if (fieldIsList && refFieldIsList) {
        const typeNames = [typeName, refTypeName].sort();
        const joinTypeName = getJoinTypeName(typeName, refTypeName);

        if (types[joinTypeName]) {
          continue;
        }

        directives.type = {
          name: joinTypeName,
          keys: getKeyFieldNames(typeName, refTypeName),
        };

        refListField.directives.type = {
          name: joinTypeName,
          keys: getKeyFieldNames(refTypeName, typeName),
        };

        const keyFieldNames = getKeyFieldNames(typeNames[0], typeNames[1]);

        types[joinTypeName] = {
          name: joinTypeName,
          directives: { join: {} },
          fields: createObject({
            [keyFieldNames[0]]: {
              name: keyFieldNames[0],
              type: primaryKeyTypeName,
              list: false,
              nullable: false,
              scalar: true,
              directives: {
                ref: {
                  name: typeNames[0],
                },
              },
            },
            [keyFieldNames[1]]: {
              name: keyFieldNames[1],
              type: primaryKeyTypeName,
              list: false,
              nullable: false,
              scalar: true,
              directives: {
                ref: {
                  name: typeNames[1],
                },
              },
            },
          }),
        };

        continue;
      }

      // 1:*
      if (fieldIsList && !refFieldIsList) {
        const refNonListFieldName = getFieldName(typeName);
        const keyFieldName = getKeyFieldName(typeName);

        directives.field = {
          name: refNonListFieldName,
          key: keyFieldName,
        };

        refTypeFields[refNonListFieldName] = {
          name: refNonListFieldName,
          type: typeName,
          list: false,
          nullable: true,
          scalar: false,
          directives: {
            key: {
              name: keyFieldName,
            },
          },
        };

        refTypeFields[keyFieldName] = {
          name: keyFieldName,
          type: primaryKeyTypeName,
          list: false,
          nullable: true,
          scalar: true,
          directives: {
            ref: {
              name: typeName,
            },
          },
        };

        continue;
      }

      // 1:1
      if (!fieldIsList && !refFieldIsList) {
        if (field.nullable) {
          const refNonListFieldName = getFieldName(typeName);
          const keyFieldName = getKeyFieldName(typeName);

          directives.field = {
            name: refNonListFieldName,
            key: keyFieldName,
          };

          refTypeFields[refNonListFieldName] = {
            name: refNonListFieldName,
            type: typeName,
            list: false,
            nullable: true,
            scalar: false,
            directives: {
              key: { name: keyFieldName },
            },
          };

          refTypeFields[keyFieldName] = {
            name: keyFieldName,
            type: primaryKeyTypeName,
            list: false,
            nullable: true,
            scalar: true,
            directives: {
              ref: {
                name: typeName,
              },
              unique: {},
            },
          };
        } else {
          const refNonListFieldName = getFieldName(typeName);
          const keyFieldName = getKeyFieldName(refTypeName);

          refTypeFields[refNonListFieldName] = {
            name: refNonListFieldName,
            type: typeName,
            list: false,
            nullable: true,
            scalar: false,
            directives: {
              field: { name: fieldName, key: keyFieldName },
            },
          };

          directives.key = {
            name: keyFieldName,
          };

          type.fields[keyFieldName] = {
            name: keyFieldName,
            type: primaryKeyTypeName,
            list: false,
            nullable: false,
            scalar: true,
            directives: {
              ref: {
                name: refTypeName,
              },
              unique: {},
            },
          };
        }

        continue;
      }
    }
  }

  return types;
};

const baseFields = Object.values(parse(baseType + customScalars))[0].fields;

export const base = (types: Types) => {
  for (const type of Object.values(types)) {
    type.fields = createObject(baseFields, type.fields);
  }

  return types;
};

export const build = (types: Types) => {
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

  return format(schema);
};
