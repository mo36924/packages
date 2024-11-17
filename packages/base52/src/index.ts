import basex from "base-x";

const base52 = basex("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz");

export const { encode, decode } = base52;
