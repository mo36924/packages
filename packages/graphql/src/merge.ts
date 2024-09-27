import { GraphQLError, GraphQLScalarTypeConfig, GraphQLSchema } from "graphql";

const validateDate = (date: Date): boolean => {
  const time = date.getTime();
  // eslint-disable-next-line no-self-compare
  return time === time;
};

const dateTypeConfig: Partial<GraphQLScalarTypeConfig<Date, (string | number)[]>> = {
  parseValue(value: any) {
    if (typeof value === "string") {
      const date = new Date(value);

      if (validateDate(date)) {
        return date;
      }

      throw new GraphQLError(`Date cannot represent an invalid date string ${value}`);
    } else if (value instanceof Date) {
      if (validateDate(value)) {
        return value;
      }

      throw new GraphQLError(`Date cannot represent an invalid date`);
    }

    throw new GraphQLError(`Date cannot represent non string or Date type ${JSON.stringify(value)}`);
  },
  parseLiteral(valueNode) {
    if (valueNode.kind !== "StringValue") {
      throw new GraphQLError(`Date cannot represent non string kind ${valueNode.kind}`, {
        nodes: valueNode,
      });
    }

    const date = new Date(valueNode.value);

    if (validateDate(date)) {
      throw new GraphQLError(`Date cannot represent an invalid date string ${valueNode.value}`, {
        nodes: valueNode,
      });
    }

    return date;
  },
};

export const mergeCustomScalars = (schema: GraphQLSchema) => {
  const Date = schema.getType("Date")!;
  Object.assign(Date, dateTypeConfig);
  return schema;
};
