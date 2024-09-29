import { D1Database } from "@cloudflare/workers-types";
import { Miniflare } from "miniflare";

const getMf = () => {
  const mf = new Miniflare({
    modules: true,
    script: `
      export default {
        async fetch() {
          return new Response();
        }
      }
    `,
    d1Databases: {
      DB: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    },
  });

  return mf;
};

export const exec = async (query: string) => {
  const mf = getMf();
  const db = await mf.getD1Database("DB");
  const result = await db.exec(query);
  await mf.dispose();
  return result;
};

export const connect = async <T>(fn: (db: D1Database) => Promise<T>) => {
  const mf = getMf();
  const db = await mf.getD1Database("DB");
  const result = await fn(db);
  await mf.dispose();
  return result;
};
