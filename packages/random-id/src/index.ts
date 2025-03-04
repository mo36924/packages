import { randomBytes } from "node:crypto";

const randomIdLength = 22;
let ids = "";

/**
 * Generates a Base62 random ID
 * @returns Base62 random ID
 */
export const randomId = (): string => {
  if (ids.length < randomIdLength) {
    ids += randomBytes(4096).toString("base64").replace(/[+/=]/g, "");
    return randomId();
  }

  const id = ids.slice(0, randomIdLength);
  ids = ids.slice(randomIdLength);
  return id;
};
