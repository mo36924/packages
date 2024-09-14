import { GraphQLError, GraphQLScalarTypeConfig, GraphQLSchema, print } from "graphql";
import { inspect } from "graphql/jsutils/inspect";

export const customScalarTypeNames = ["Date", "JSON"] as const;

export const customScalars = customScalarTypeNames.map((name) => `scalar ${name}\n`).join("");

export type CustomScalarTypeName = (typeof customScalarTypeNames)[number];

export const isCustomScalarTypeName = (type: string): type is CustomScalarTypeName =>
  customScalarTypeNames.includes(type as CustomScalarTypeName);

export const scalarTypeNames = ["ID", "Int", "Float", "String", "Boolean", ...customScalarTypeNames] as const;

export type ScalarTypeName = (typeof scalarTypeNames)[number];

export const isScalarTypeName = (name: string): name is ScalarTypeName => scalarTypeNames.includes(name as any);

export const primaryKeyTypeName = "String" satisfies ScalarTypeName;

const dateTypeConfig: Partial<GraphQLScalarTypeConfig<Date, (string | number)[]>> = {
  serialize(date) {
    if (date == null || !(date instanceof Date) || Number.isNaN(date.getTime())) {
      throw new GraphQLError("Date cannot represent value: ".concat(inspect(date)), {});
    }

    return [0, date.toJSON()];
  },
  parseValue(value: any) {
    let date: Date;

    if (Array.isArray(value) && value.length === 2 && value[0] === 0 && typeof value[1] === "string") {
      const value1 = value[1];
      date = new Date(value1);

      if (value1 !== date.toJSON()) {
        throw new GraphQLError("Date cannot represent value: ".concat(inspect(value)), {});
      }
    } else if (value instanceof Date) {
      date = value;
    } else {
      date = new Date(value);
    }

    if (Number.isNaN(date.getTime())) {
      throw new GraphQLError("Date cannot represent value: ".concat(inspect(value)), {});
    }

    return date;
  },
  parseLiteral(valueNode) {
    if (valueNode.kind !== "StringValue") {
      throw new GraphQLError("Date cannot represent a non string value: ".concat(print(valueNode)), {
        nodes: valueNode,
      });
    }

    const date = new Date(valueNode.value);

    if (Number.isNaN(date.getTime())) {
      throw new GraphQLError("Date cannot represent value: ".concat(inspect(valueNode.value)), {});
    }

    return date;
  },
};

export const mergeCustomScalars = (schema: GraphQLSchema) => {
  const Date = schema.getType("Date")!;
  Object.assign(Date, dateTypeConfig);
  return schema;
};
