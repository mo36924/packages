import { buildSchema } from "graphql";
import { getConfig } from "./config";

export const schema = getConfig().schema ?? buildSchema("scalar _");
