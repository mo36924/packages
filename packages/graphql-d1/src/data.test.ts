import { schema } from "@mo36924/graphql/schema.gql";
import { expect, it } from "vitest";
import { buildData } from "./data";
import { exec } from "./db";
import { buildSchema as buildSQLiteSchema } from "./schema";

it("buildData", async () => {
  const ddl = buildSQLiteSchema(schema);
  const dml = buildData(schema);

  await exec(ddl + dml);

  expect(dml).toMatchInlineSnapshot(`
    "insert into "Class" ("id","createdAt","updatedAt","name") values ('Class-id-1',0,0,'name-1'),('Class-id-2',0,0,'name-2'),('Class-id-3',0,0,'name-3');
    insert into "Club" ("id","createdAt","updatedAt","name") values ('Club-id-1',0,0,'name-1'),('Club-id-2',0,0,'name-2'),('Club-id-3',0,0,'name-3');
    insert into "Profile" ("id","createdAt","updatedAt","age","userId") values ('Profile-id-1',0,0,0,'User-id-1'),('Profile-id-2',0,0,0,'User-id-2'),('Profile-id-3',0,0,0,'User-id-3'),('Profile-id-4',0,0,0,'User-id-4'),('Profile-id-5',0,0,0,'User-id-5'),('Profile-id-6',0,0,0,'User-id-6'),('Profile-id-7',0,0,0,'User-id-7'),('Profile-id-8',0,0,0,'User-id-8'),('Profile-id-9',0,0,0,'User-id-9');
    insert into "User" ("id","createdAt","updatedAt","classId","name") values ('User-id-1',0,0,'Class-id-1','name-1'),('User-id-2',0,0,'Class-id-2','name-2'),('User-id-3',0,0,'Class-id-3','name-3'),('User-id-4',0,0,'Class-id-1','name-4'),('User-id-5',0,0,'Class-id-2','name-5'),('User-id-6',0,0,'Class-id-3','name-6'),('User-id-7',0,0,'Class-id-1','name-7'),('User-id-8',0,0,'Class-id-2','name-8'),('User-id-9',0,0,'Class-id-3','name-9');
    insert into "ClubToUser" ("id","createdAt","updatedAt","clubId","userId") values ('ClubToUser-id-1',0,0,'Club-id-1','User-id-1'),('ClubToUser-id-2',0,0,'Club-id-2','User-id-2'),('ClubToUser-id-3',0,0,'Club-id-3','User-id-3'),('ClubToUser-id-4',0,0,'Club-id-1','User-id-4'),('ClubToUser-id-5',0,0,'Club-id-2','User-id-5'),('ClubToUser-id-6',0,0,'Club-id-3','User-id-6'),('ClubToUser-id-7',0,0,'Club-id-1','User-id-7'),('ClubToUser-id-8',0,0,'Club-id-2','User-id-8'),('ClubToUser-id-9',0,0,'Club-id-3','User-id-9'),('ClubToUser-id-10',0,0,'Club-id-1','User-id-1'),('ClubToUser-id-11',0,0,'Club-id-2','User-id-2'),('ClubToUser-id-12',0,0,'Club-id-3','User-id-3'),('ClubToUser-id-13',0,0,'Club-id-1','User-id-4'),('ClubToUser-id-14',0,0,'Club-id-2','User-id-5'),('ClubToUser-id-15',0,0,'Club-id-3','User-id-6'),('ClubToUser-id-16',0,0,'Club-id-1','User-id-7'),('ClubToUser-id-17',0,0,'Club-id-2','User-id-8'),('ClubToUser-id-18',0,0,'Club-id-3','User-id-9'),('ClubToUser-id-19',0,0,'Club-id-1','User-id-1'),('ClubToUser-id-20',0,0,'Club-id-2','User-id-2'),('ClubToUser-id-21',0,0,'Club-id-3','User-id-3'),('ClubToUser-id-22',0,0,'Club-id-1','User-id-4'),('ClubToUser-id-23',0,0,'Club-id-2','User-id-5'),('ClubToUser-id-24',0,0,'Club-id-3','User-id-6'),('ClubToUser-id-25',0,0,'Club-id-1','User-id-7'),('ClubToUser-id-26',0,0,'Club-id-2','User-id-8'),('ClubToUser-id-27',0,0,'Club-id-3','User-id-9');
    "
  `);
});
