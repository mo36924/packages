import { TransformOptions } from "@babel/core";
import flattenNestedFragments from "@mo36924/babel-plugin-flatten-nested-fragments";
import graphql, { Options as GraphQLOptions } from "@mo36924/babel-plugin-graphql-tagged-template";
import injectAssetJsxElements, {
  Options as InjectAssetJsxElementsOptions,
} from "@mo36924/babel-plugin-inject-asset-jsx-elements";
import jsxDisplayName from "@mo36924/babel-plugin-jsx-display-name";
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
  { development, server, manifest = {}, schema }: Options = {},
): Pick<TransformOptions, "plugins"> => {
  return {
    plugins: [
      [serverFunction, { server, development } satisfies ServerFunctionOptions],
      [injectAssetJsxElements, manifest satisfies InjectAssetJsxElementsOptions],
      [
        replaceJsxElements,
        server
          ? ({
              body: "Body",
              A: "a",
            } satisfies ReplaceJsxElementsOptions)
          : ({
              html: "Fragment",
              head: "Fragment",
              meta: "Fragment",
              link: "Fragment",
              script: "Fragment",
              body: "Fragment",
              title: "Title",
              A: "a",
            } satisfies ReplaceJsxElementsOptions),
      ],
      flattenNestedFragments,
      [jsxDisplayName, development ? undefined : false],
      [graphql, schema ? ({ development, schema } satisfies GraphQLOptions) : false],
    ],
  };
};
