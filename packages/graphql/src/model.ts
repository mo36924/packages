import { buildSchema } from "graphql";
import { modelDirectives, schemaDirectives } from "./directives";
import {
  baseType,
  Field,
  getFieldName,
  getKeyFieldName,
  getKeyFieldNames,
  getListFieldName,
  isReservedFieldName,
} from "./fields";
import { formatGraphQL } from "./format";
import { customScalars, primaryKeyTypeName } from "./scalars";
import { buildTypes, getJoinTypeName, getTypeName, isReservedTypeName, printTypes, sortTypes } from "./types";
import { createObject } from "./utils";

export const fixModel = (model: string) => {
  const types = buildTypes(model + customScalars + modelDirectives);
  const joinTypeNameSet = new Set<string>();
  const renameJoinTypeFields: Field[] = [];

  for (let [typeName, type] of Object.entries(types)) {
    delete types[typeName];
    typeName = getTypeName(typeName);

    if (isReservedTypeName(typeName)) {
      continue;
    }

    const { fields } = (types[typeName] = {
      ...type,
      name: typeName,
      directives: {},
    });

    for (let [fieldName, field] of Object.entries(fields)) {
      delete fields[fieldName];
      const { type, scalar, list, directives } = field;
      fieldName = (list ? getListFieldName : getFieldName)(fieldName);

      if (isReservedFieldName(fieldName)) {
        continue;
      }

      const fieldType = getTypeName(type);

      field = fields[fieldName] = {
        ...field,
        name: fieldName,
        type: fieldType,
      };

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

  const fixedModel = printTypes(sortTypes(types));
  buildSchema(customScalars + modelDirectives + fixedModel);
  return formatGraphQL(fixedModel);
};

export const buildModel = (model: string) => {
  const types = buildTypes(model + customScalars + modelDirectives);
  const baseFields = Object.values(buildTypes(baseType + customScalars))[0].fields;

  for (const [typeName, { fields }] of Object.entries(types)) {
    for (const [fieldName, field] of Object.entries(Object.assign(fields, baseFields))) {
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
          fields: createObject(baseFields, {
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
          fields: createObject(baseFields, {
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

          fields[keyFieldName] = {
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

  const buildedModel = customScalars + schemaDirectives + printTypes(sortTypes(types));
  buildSchema(buildedModel);
  return buildedModel;
};
