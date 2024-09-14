import { GraphQLSchema } from "graphql";
import { ScalarTypeName } from "./scalars";
import { getSchemaTypes } from "./schema";
import { isSchemaTypeName } from "./types";
import { createObject } from "./utils";

export const buildData = (schema: GraphQLSchema, baseRecordCount = 3) => {
  const types = getSchemaTypes(schema);
  const recordCounts = createObject<{ [typeName: string]: number }>();

  const getRecordCount = (dep: string, deps: string[] = []): number => {
    if (deps.includes(dep)) {
      return 0;
    }

    if (recordCounts[dep]) {
      return recordCounts[dep];
    }

    const recordCount = Math.max(
      baseRecordCount,
      ...Object.values(types[dep].fields).map(({ directives: { ref, unique } }) =>
        ref ? getRecordCount(ref.name, [dep, ...deps]) * (unique ? 1 : baseRecordCount) : 0,
      ),
    );

    recordCounts[dep] = recordCount;
    return recordCount;
  };

  const dataTypes = createObject(
    Object.fromEntries(
      Object.entries(types)
        .filter(([typeName]) => !isSchemaTypeName(typeName))
        .map(([typeName, type], index) => [typeName, { ...type, index, count: getRecordCount(typeName) }]),
    ),
  );

  const defaultDataValues: { [key: string]: any } = createObject<{
    [key in ScalarTypeName]: any;
  }>({
    ID: "",
    Int: 0,
    Float: 0,
    String: "",
    Boolean: true,
    Date: new Date(0),
    JSON: {},
  });

  return Object.entries(dataTypes).map(([table, type]) => {
    const { index, count } = dataTypes[table];
    const fields = Object.values(type.fields).filter((field) => field.scalar);
    return {
      ...type,
      index,
      count,
      fields: fields.map(({ name }) => name),
      values: [...Array.from({ length: count }).keys()].map((i) =>
        fields.map((field) => {
          const {
            name,
            type,
            directives: { ref },
          } = field;

          let value = defaultDataValues[type];

          if (name === "id") {
            value = `${table}-id-${i + 1}`;
          } else if (ref) {
            const { count, name } = dataTypes[ref.name];
            value = `${name}-id-${(i % count) + 1}`;
          } else if (typeof value === "string") {
            value = `${name}-${i + 1}`;
          }

          return { ...field, value };
        }),
      ),
    };
  });
};
