import { schema } from "@mo36924/graphql/schema.gql";
import { expect, it } from "vitest";
import { buildDrizzleSchema } from "./drizzle";

it("buildDrizzleSchema", async () => {
  const drizzleSchema = buildDrizzleSchema("schema.ts", schema);

  expect(drizzleSchema).toMatchInlineSnapshot(`
    "import { randomId } from "@mo36924/random-id";
    import { relations } from "drizzle-orm";
    import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

    export const Class = sqliteTable("Class", {
      id: text("id").notNull().primaryKey().$default(randomId),
      createdAt: integer("createdAt", { mode: "timestamp_ms" })
        .notNull()
        .$default(() => new Date()),
      updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
        .notNull()
        .$onUpdate(() => new Date()),
      name: text("name").notNull(),
    });

    export const ClassRelations = relations(Class, ({ many }) => ({
      users: many(User),
    }));

    export const Club = sqliteTable("Club", {
      id: text("id").notNull().primaryKey().$default(randomId),
      createdAt: integer("createdAt", { mode: "timestamp_ms" })
        .notNull()
        .$default(() => new Date()),
      updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
        .notNull()
        .$onUpdate(() => new Date()),
      name: text("name").notNull(),
    });

    export const ClubRelations = relations(Club, ({ many }) => ({
      clubToUser: many(ClubToUser),
    }));

    export const Profile = sqliteTable(
      "Profile",
      {
        id: text("id").notNull().primaryKey().$default(randomId),
        createdAt: integer("createdAt", { mode: "timestamp_ms" })
          .notNull()
          .$default(() => new Date()),
        updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
          .notNull()
          .$onUpdate(() => new Date()),
        age: integer("age", { mode: "number" }),
        userId: text("userId"),
      },
      (table) => ({
        userId: uniqueIndex("Profile_userId").on(table.userId),
      }),
    );

    export const ProfileRelations = relations(Profile, ({ one }) => ({
      user: one(User, { fields: [Profile.userId], references: [User.id] }),
    }));

    export const User = sqliteTable(
      "User",
      {
        id: text("id").notNull().primaryKey().$default(randomId),
        createdAt: integer("createdAt", { mode: "timestamp_ms" })
          .notNull()
          .$default(() => new Date()),
        updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
          .notNull()
          .$onUpdate(() => new Date()),
        classId: text("classId"),
        name: text("name").notNull(),
      },
      (table) => ({
        classId: index("User_classId").on(table.classId),
      }),
    );

    export const UserRelations = relations(User, ({ many, one }) => ({
      class: one(Class, { fields: [User.classId], references: [Class.id] }),
      clubToUser: many(ClubToUser),
      profile: one(Profile),
    }));

    export const ClubToUser = sqliteTable(
      "ClubToUser",
      {
        id: text("id").notNull().primaryKey().$default(randomId),
        createdAt: integer("createdAt", { mode: "timestamp_ms" })
          .notNull()
          .$default(() => new Date()),
        updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
          .notNull()
          .$onUpdate(() => new Date()),
        clubId: text("clubId").notNull(),
        userId: text("userId").notNull(),
      },
      (table) => ({
        clubId: index("ClubToUser_clubId").on(table.clubId),
        userId: index("ClubToUser_userId").on(table.userId),
      }),
    );

    export const ClubToUserRelations = relations(ClubToUser, ({ one }) => ({
      club: one(Club, { fields: [ClubToUser.clubId], references: [Club.id] }),
      user: one(User, { fields: [ClubToUser.userId], references: [User.id] }),
    }));
    "
  `);
});
