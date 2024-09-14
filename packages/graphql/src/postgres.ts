import { FieldNode, getArgumentValues, GraphQLError, GraphQLSchema, OperationDefinitionNode } from "graphql";
import { ExecutionContext } from "graphql/execution/execute";
import { getFieldDef } from "./fields";
import { ComparisonOperator, LogicalOperator } from "./operators";
import { ScalarTypeName } from "./scalars";
import { getSchemaTypes } from "./schema";
import { isSchemaTypeName } from "./types";
import { createObject } from "./utils";

type QueryContext = ExecutionContext & { values: any[]; ids?: { [type: string]: string[] | undefined } };
type Queries = [sql: string, values: any[]];

const identifier = (value: string) => `"${value.replaceAll('"', '""')}"`;

const literal = (value: string | number | boolean | Date | null | undefined) => {
  if (value == null) {
    return "null";
  }

  switch (typeof value) {
    case "boolean":
      return value ? "true" : "false";
    case "number":
      return value.toString();
    case "object":
      if (value instanceof Date) {
        const iso = value.toISOString();
        return `'${iso.slice(0, 10)} ${iso.slice(11, 23)}'`;
      }

      value = String(value);
  }

  value = `'${value.replaceAll("'", "''")}'`;

  if (value.includes("\\")) {
    value = `E${value.replaceAll("\\", "\\\\")}`;
  }

  return value;
};

export const query = (
  context: ExecutionContext,
  node: OperationDefinitionNode | FieldNode = context.operation,
): Queries => {
  const values: any[] = [];

  const sql = `select cast(${fields({ ...context, values }, "Query", node)} as text) as ${
    node.kind === "OperationDefinition" ? "data" : identifier((node.alias ?? node.name).value)
  };`;

  return [sql, values];
};

const fields = (context: QueryContext, parent: string, node: OperationDefinitionNode | FieldNode) =>
  `jsonb_build_object(${(node.selectionSet!.selections as FieldNode[])
    .map((node) => `${literal((node.alias ?? node.name).value)},${field(context, parent, node)}`)
    .join()})`;

const field = (context: QueryContext, parent: string, node: FieldNode) => {
  const { schema, variableValues, ids, values } = context;
  const name = node.name.value;
  const { scalar, type, list, directives, def } = getFieldDef(schema, parent, name);

  if (scalar) {
    switch (type) {
      case "Date":
        return `jsonb_build_array(1,${identifier(name)})`;
      default:
        return identifier(name);
    }
  }

  let _ids: string[] | undefined;

  if (ids) {
    _ids = ids[type];

    if (!_ids) {
      return list ? `jsonb_build_array(0)` : "null";
    }
  }

  let query: string = `select ${fields(context, type, node)} as data from ${identifier(type)}`;
  const args: { [argument: string]: any } = getArgumentValues(def, node, variableValues);
  const predicates: string[] = [];

  if (_ids) {
    predicates.push(`id in (${_ids.map(() => "?").join()})`);
    values.push(..._ids);
  }

  if (directives.type) {
    predicates.push(
      `id in (select ${identifier(directives.type.keys[1])} from ${identifier(
        directives.type.name,
      )} where ${identifier(directives.type.keys[1])} is not null and ${identifier(
        directives.type.keys[0],
      )} = ${identifier(parent)}.id)`,
    );
  } else if (directives.field) {
    predicates.push(`${identifier(directives.field.key)} = ${identifier(parent)}.id}`);
  } else if (directives.key) {
    predicates.push(`id = ${identifier(parent)}.${identifier(directives.key.name)}`);
  }

  const _where = where(context, args.where);

  if (_where) {
    predicates.push(_where);
  }

  if (predicates.length) {
    query += ` where ${predicates.join(" and ")}`;
  }

  const _order = order(args.order);

  if (_order) {
    query += ` order by ${_order}`;
  }

  if (!list) {
    query += ` limit 1`;
  } else if (args.limit != null) {
    query += ` limit $${values.push(args.limit)}`;
  }

  if (args.offset != null) {
    query += ` offset $${values.push(args.offset)}`;
  }

  if (list) {
    query = `jsonb_insert(coalesce((select jsonb_agg(data) from (${query}) as t),jsonb_build_array()),'{0}',0)`;
  }

  return query;
};

const where = (context: QueryContext, args: Record<LogicalOperator, any> | null | undefined) => {
  if (!args) {
    return "";
  }

  const { not, and, or, ...fields } = args;
  const values = context.values;
  let predicates: string[] = [];

  for (const [field, operators] of Object.entries(fields)) {
    if (operators == null) {
      continue;
    }

    for (const [operator, value] of Object.entries(operators) as [ComparisonOperator, any][]) {
      if (value === null) {
        if (operator === "eq") {
          predicates.push(`${identifier(field)} is null`);
        } else if (operator === "ne") {
          predicates.push(`${identifier(field)} is not null`);
        }

        continue;
      }

      switch (operator) {
        case "eq":
          predicates.push(`${identifier(field)} = $${values.push(value)}`);
          break;
        case "ne":
          predicates.push(`${identifier(field)} <> $${values.push(value)}`);
          break;
        case "gt":
          predicates.push(`${identifier(field)} > $${values.push(value)}`);
          break;
        case "lt":
          predicates.push(`${identifier(field)} < $${values.push(value)}`);
          break;
        case "ge":
          predicates.push(`${identifier(field)} >= $${values.push(value)}`);
          break;
        case "le":
          predicates.push(`${identifier(field)} <= $${values.push(value)}`);
          break;
        case "in":
          predicates.push(`${identifier(field)} in (${value.map((_value: any) => `${values.push(_value)}`).join()})`);
          break;
        case "like":
          predicates.push(`${identifier(field)} like $${values.push(value)}`);
          break;
        default:
          throw new GraphQLError(`Invalid operator: ${operator as never}`);
      }
    }
  }

  const _not = where(context, not);

  if (_not) {
    predicates.push(`not ${_not}`);
  }

  const _and = where(context, and);

  if (_and) {
    predicates.push(_and);
  }

  if (predicates.length) {
    predicates = [predicates.join(" and ")];
  }

  const _or = where(context, or);

  if (_or) {
    predicates.push(_or);
  }

  if (!predicates.length) {
    return "";
  }

  return `(${predicates.join(" or ")})`;
};

const order = (args: { [key: string]: string } | null | undefined) =>
  args
    ? Object.entries(args)
        .map(([field, order]) => `${identifier(field)} ${order}`)
        .join()
    : "";

export const buildSchema = (schema: GraphQLSchema) => {
  const types = getSchemaTypes(schema);
  const create: string[] = [];
  const unique: string[] = [];
  const index: string[] = [];

  const dbTypes = createObject<Record<ScalarTypeName, string>>({
    ID: "text",
    Int: "integer",
    Float: "double precision",
    String: "text",
    Boolean: "boolean",
    Date: "timestamp(3) with time zone",
    JSON: "jsonb",
  });

  for (const [typeName, type] of Object.entries(types)) {
    if (isSchemaTypeName(typeName)) {
      continue;
    }

    const { fields } = type;
    const columns: string[] = [];

    for (const [fieldName, field] of Object.entries(fields)) {
      const {
        type: fieldTypeName,
        nullable,
        scalar,
        directives: { ref: refDirective, unique: uniqueDirective },
      } = field;

      if (scalar) {
        const dbType = dbTypes[fieldTypeName as ScalarTypeName];

        if (fieldName === "id") {
          columns.push(`${identifier(fieldName)} ${dbType} not null primary key`);
        } else {
          columns.push(`${identifier(fieldName)} ${dbType}${nullable ? "" : " not null"}`);
        }
      }

      if (uniqueDirective) {
        unique.push(
          `create unique index ${identifier(`${typeName}_${fieldName}`)} on ${identifier(typeName)} (${identifier(fieldName)});\n`,
        );
      } else if (refDirective) {
        index.push(
          `create index ${identifier(`${typeName}_${fieldName}`)} on ${identifier(typeName)} (${identifier(fieldName)});\n`,
        );
      }
    }

    create.push(`create table ${identifier(typeName)} (\n${columns.map((column) => `  ${column}`).join(",\n")}\n);\n`);
  }

  return [create, unique, index].flat().join("");
};
