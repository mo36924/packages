import { TransformOptions } from "@babel/core";
import flattenNestedFragments from "@mo36924/babel-plugin-flatten-nested-fragments";
import injectAssetJsxElements, {
  Options as InjectAssetJsxElementsOptions,
} from "@mo36924/babel-plugin-inject-asset-jsx-elements";
import jsxDisplayName from "@mo36924/babel-plugin-jsx-display-name";
import replaceJsxElements, { Options as ReplaceJsxElementsOptions } from "@mo36924/babel-plugin-replace-jsx-elements";
import serverFunction, { Options as ServerFunctionOptions } from "@mo36924/babel-plugin-server-function";
import { Manifest } from "vite";

export type Options = {
  development?: boolean;
  server?: boolean;
  manifest?: Manifest;
};

export default (
  _: any = {},
  { development, server, manifest = {} }: Options = {},
): Pick<TransformOptions, "plugins"> => {
  return {
    plugins: [
      [serverFunction, { development, server } satisfies ServerFunctionOptions],
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
    ],
  };
};
