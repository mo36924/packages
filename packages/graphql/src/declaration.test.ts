import { expect, it } from "vitest";
import { buildDeclaration } from "./declaration";
import { formatDeclaration } from "./format";
import { buildSchema } from "./schema";
import { model } from "./test/model";

it("buildDeclaration", () => {
  const schema = buildSchema(model);
  const declaration = buildDeclaration(schema);
  const formattedDeclaration = formatDeclaration(declaration);

  expect(formattedDeclaration).toMatchInlineSnapshot(`
    "export type {};
    declare global {
      namespace GraphQL {
        export type CreateData = {
          class?: CreateDataClass | null;
          classes?: CreateDataClass[] | null;
          club?: CreateDataClub | null;
          clubs?: CreateDataClub[] | null;
          profile?: CreateDataProfile | null;
          profiles?: CreateDataProfile[] | null;
          user?: CreateDataUser | null;
          users?: CreateDataUser[] | null;
        };
        export type UpdateData = {
          class?: UpdateDataClass | null;
          classes?: UpdateDataClass[] | null;
          club?: UpdateDataClub | null;
          clubs?: UpdateDataClub[] | null;
          profile?: UpdateDataProfile | null;
          profiles?: UpdateDataProfile[] | null;
          user?: UpdateDataUser | null;
          users?: UpdateDataUser[] | null;
        };
        export type DeleteData = {
          class?: DeleteDataClass | null;
          classes?: DeleteDataClass[] | null;
          club?: DeleteDataClub | null;
          clubs?: DeleteDataClub[] | null;
          profile?: DeleteDataProfile | null;
          profiles?: DeleteDataProfile[] | null;
          user?: DeleteDataUser | null;
          users?: DeleteDataUser[] | null;
        };
        export type CreateDataClass = {
          name: string;
          users?: CreateDataUser[] | null;
        };
        export type CreateDataClub = {
          name: string;
          users?: CreateDataUser[] | null;
        };
        export type CreateDataProfile = {
          age?: number | null;
          user?: CreateDataUser | null;
        };
        export type CreateDataUser = {
          class?: CreateDataClass | null;
          clubs?: CreateDataClub[] | null;
          name: string;
          profile?: CreateDataProfile | null;
        };
        export type UpdateDataClass = {
          id: string;
          name?: string | null;
          users?: UpdateDataUser[] | null;
        };
        export type UpdateDataClub = {
          id: string;
          name?: string | null;
          users?: UpdateDataUser[] | null;
        };
        export type UpdateDataProfile = {
          id: string;
          age?: number | null;
          user?: UpdateDataUser | null;
        };
        export type UpdateDataUser = {
          id: string;
          class?: UpdateDataClass | null;
          clubs?: UpdateDataClub[] | null;
          name?: string | null;
          profile?: UpdateDataProfile | null;
        };
        export type DeleteDataClass = {
          id: string;
          users?: DeleteDataUser[] | null;
        };
        export type DeleteDataClub = {
          id: string;
          users?: DeleteDataUser[] | null;
        };
        export type DeleteDataProfile = {
          id: string;
          user?: DeleteDataUser | null;
        };
        export type DeleteDataUser = {
          id: string;
          class?: DeleteDataClass | null;
          clubs?: DeleteDataClub[] | null;
          profile?: DeleteDataProfile | null;
        };
        export type WhereClass = {
          id?: WhereString | null;
          createdAt?: WhereDate | null;
          updatedAt?: WhereDate | null;
          name?: WhereString | null;
          and?: WhereClass | null;
          or?: WhereClass | null;
          not?: WhereClass | null;
        };
        export type WhereClub = {
          id?: WhereString | null;
          createdAt?: WhereDate | null;
          updatedAt?: WhereDate | null;
          name?: WhereString | null;
          and?: WhereClub | null;
          or?: WhereClub | null;
          not?: WhereClub | null;
        };
        export type WhereProfile = {
          id?: WhereString | null;
          createdAt?: WhereDate | null;
          updatedAt?: WhereDate | null;
          age?: WhereInt | null;
          userId?: WhereString | null;
          and?: WhereProfile | null;
          or?: WhereProfile | null;
          not?: WhereProfile | null;
        };
        export type WhereUser = {
          id?: WhereString | null;
          createdAt?: WhereDate | null;
          updatedAt?: WhereDate | null;
          classId?: WhereString | null;
          name?: WhereString | null;
          and?: WhereUser | null;
          or?: WhereUser | null;
          not?: WhereUser | null;
        };
        export type WhereID = {
          eq?: string | null;
          ne?: string | null;
          gt?: string | null;
          lt?: string | null;
          ge?: string | null;
          le?: string | null;
          in?: string[] | null;
          like?: string | null;
        };
        export type WhereInt = {
          eq?: number | null;
          ne?: number | null;
          gt?: number | null;
          lt?: number | null;
          ge?: number | null;
          le?: number | null;
          in?: number[] | null;
          like?: string | null;
        };
        export type WhereFloat = {
          eq?: number | null;
          ne?: number | null;
          gt?: number | null;
          lt?: number | null;
          ge?: number | null;
          le?: number | null;
          in?: number[] | null;
          like?: string | null;
        };
        export type WhereString = {
          eq?: string | null;
          ne?: string | null;
          gt?: string | null;
          lt?: string | null;
          ge?: string | null;
          le?: string | null;
          in?: string[] | null;
          like?: string | null;
        };
        export type WhereBoolean = {
          eq?: boolean | null;
          ne?: boolean | null;
        };
        export type WhereDate = {
          eq?: Date | null;
          ne?: Date | null;
          gt?: Date | null;
          lt?: Date | null;
          ge?: Date | null;
          le?: Date | null;
          in?: Date[] | null;
          like?: string | null;
        };
        export type WhereJSON = {
          eq?: object | null;
          ne?: object | null;
          gt?: object | null;
          lt?: object | null;
          ge?: object | null;
          le?: object | null;
          in?: object[] | null;
          like?: string | null;
        };
        export type OrderClass = {
          id?: Order | null;
          createdAt?: Order | null;
          updatedAt?: Order | null;
          name?: Order | null;
        };
        export type OrderClub = {
          id?: Order | null;
          createdAt?: Order | null;
          updatedAt?: Order | null;
          name?: Order | null;
        };
        export type OrderProfile = {
          id?: Order | null;
          createdAt?: Order | null;
          updatedAt?: Order | null;
          age?: Order | null;
          userId?: Order | null;
        };
        export type OrderUser = {
          id?: Order | null;
          createdAt?: Order | null;
          updatedAt?: Order | null;
          classId?: Order | null;
          name?: Order | null;
        };
      }
    }
    "
  `);
});
