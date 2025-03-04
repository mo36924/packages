import { existsSync } from "node:fs";
import { env } from "node:process";
import { TransformOptions } from "@babel/core";
import deadCodeElimination from "@mo36924/babel-plugin-dead-code-elimination";
import flattenNestedFragments from "@mo36924/babel-plugin-flatten-nested-fragments";
import graphql, { Options as GraphQLOptions } from "@mo36924/babel-plugin-graphql";
import inject, { Options as InjectOptions } from "@mo36924/babel-plugin-inject";
import injectAssetJsxElements, {
  Options as InjectAssetJsxElementsOptions,
} from "@mo36924/babel-plugin-inject-asset-jsx-elements";
import jsxDisplayName from "@mo36924/babel-plugin-jsx-display-name";
import replace, { Options as ReplaceOptions } from "@mo36924/babel-plugin-replace";
import replaceJsxElements, { Options as ReplaceJsxElementsOptions } from "@mo36924/babel-plugin-replace-jsx-elements";
import serverFunction, { Options as ServerFunctionOptions } from "@mo36924/babel-plugin-server-function";
import { GraphQLSchema } from "graphql";
import { Manifest } from "vite";

export type Options = {
  development?: boolean;
  server?: boolean;
  manifest?: Manifest;
  schema?: GraphQLSchema;
};

export default (
  _: any = {},
  { development = env.NODE_ENV === "development", server, manifest, schema }: Options = {},
): Pick<TransformOptions, "plugins"> => {
  return {
    plugins: [
      [serverFunction, { ssr: server, development } satisfies ServerFunctionOptions],
      [injectAssetJsxElements, { manifest } satisfies InjectAssetJsxElementsOptions],
      [
        replaceJsxElements,
        {
          replaceTags: server
            ? {
                body: "Body",
                Suspense: "Fragment",
                A: "a",
              }
            : {
                html: "Fragment",
                head: "Fragment",
                meta: "Fragment",
                link: "Fragment",
                script: "Fragment",
                body: "Fragment",
                title: "Title",
                A: "a",
              },
        } satisfies ReplaceJsxElementsOptions,
      ],
      [
        inject,
        {
          ...(existsSync("./src/components/Html.tsx") ? { Html: ["./src/components/Html.tsx", "default"] } : {}),
          Title: [
            existsSync("./src/components/Title.tsx") ? "./src/components/Title.tsx" : "@mo36924/react-components/Title",
            "default",
          ],
          Body: [
            existsSync("./src/components/Body.tsx") ? "./src/components/Body.tsx" : "@mo36924/react-components/Body",
            "default",
          ],
        } satisfies InjectOptions,
      ],
      flattenNestedFragments,
      [jsxDisplayName, development ? undefined : false],
      [graphql, { development, schema } satisfies GraphQLOptions],
      [
        replace,
        {
          "import.meta.env.PROD": !development,
          "import.meta.env.DEV": development,
          "import.meta.env.SSR": !!server,
          "process.env.NODE_ENV": JSON.stringify(development ? "development" : "production"),
        } satisfies ReplaceOptions,
      ],
      deadCodeElimination,
    ],
  };
};
