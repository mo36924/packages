import { DocumentNode } from "graphql";

export type Queries = { [key: string]: DocumentNode };

// @ts-expect-error queries is set to a value by Babel
export const queries: Queries = (globalThis.__GRAPHQL_QUERIES__ ??= Object.create(null));
