import { ComparisonOperator, LogicalOperator } from "@mo36924/graphql";
import { getFieldDef } from "@mo36924/graphql/definitions";
import { FieldNode, getArgumentValues, GraphQLError, OperationDefinitionNode } from "graphql";
import { ExecutionContext } from "graphql/execution/execute";
import { identifier, literal } from "./escape";

type QueryContext = ExecutionContext & { values: any[]; ids?: { [type: string]: string[] | undefined } };
type Queries = [sql: string, values: any[]];

export const buildQuery = (
  context: ExecutionContext,
  node: OperationDefinitionNode | FieldNode = context.operation,
): Queries => {
  const values: any[] = [];

  const sql = `select json(${fields({ ...context, values }, "Query", node)}) as ${
    node.kind === "OperationDefinition" ? "data" : identifier((node.alias ?? node.name).value)
  };`;

  return [sql, values];
};

const fields = (context: QueryContext, parent: string, node: OperationDefinitionNode | FieldNode) =>
  `json_object(${(node.selectionSet!.selections as FieldNode[])
    .map((node) => `${literal((node.alias ?? node.name).value)},${field(context, parent, node)}`)
    .join()})`;

const field = (context: QueryContext, parent: string, node: FieldNode) => {
  const { schema, variableValues, ids, values } = context;
  const name = node.name.value;
  const { scalar, type, list, directives, def } = getFieldDef(schema, parent, name);

  if (scalar) {
    switch (type) {
      case "String":
        return `'0'||${identifier(name)}`;
      case "Date":
        return `'1'||strftime('%FT%R:%fZ',${identifier(name)}/1000.0,'unixepoch')`;
      default:
        return identifier(name);
    }
  }

  let _ids: string[] | undefined;

  if (ids) {
    _ids = ids[type];

    if (!_ids) {
      return list ? `json_array()` : "null";
    }
  }

  let query: string = `select ${fields(context, type, node)} as data from ${identifier(type)}`;
  const args: { [argument: string]: any } = getArgumentValues(def, node, variableValues);
  const predicates: string[] = [];

  if (_ids) {
    predicates.push(`id in (${_ids.map((id) => `?${values.push(id)}`).join()})`);
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
    predicates.push(`${identifier(directives.field.key)} = ${identifier(parent)}.id`);
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
    query += ` limit ?${values.push(args.limit)}`;
  }

  if (args.offset != null) {
    query += ` offset ?${values.push(args.offset)}`;
  }

  if (list) {
    // https://sqlite.org/forum/forumpost/87347ad2fb5a8f76
    query = `coalesce((select json_group_array(json(data)) from (${query}) as t),json_array())`;
  } else {
    query = `(${query})`;
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
          predicates.push(`${identifier(field)} = ?${values.push(value)}`);
          break;
        case "ne":
          predicates.push(`${identifier(field)} <> ?${values.push(value)}`);
          break;
        case "gt":
          predicates.push(`${identifier(field)} > ?${values.push(value)}`);
          break;
        case "lt":
          predicates.push(`${identifier(field)} < ?${values.push(value)}`);
          break;
        case "ge":
          predicates.push(`${identifier(field)} >= ?${values.push(value)}`);
          break;
        case "le":
          predicates.push(`${identifier(field)} <= ?${values.push(value)}`);
          break;
        case "in":
          predicates.push(`${identifier(field)} in (${value.map((_value: any) => `?${values.push(_value)}`).join()})`);
          break;
        case "like":
          predicates.push(`${identifier(field)} like ?${values.push(value)}`);
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
