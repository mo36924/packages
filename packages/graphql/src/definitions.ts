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
import { getDirectives } from "./directives";
import { memoize3 } from "./utils";

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
  };
});
