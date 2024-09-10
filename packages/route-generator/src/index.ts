import { writeFileSync } from "node:fs";
import { pascalCase } from "change-case";
import glob from "fast-glob";
import { format, resolveConfig } from "prettier";

export type Options = {
  rootDir?: string;
  outFile?: string;
  include?: string | string[];
  exclude?: string | string[];
  importPrefix?: string;
};

export const generateRoutes = async ({
  rootDir = "src/pages",
  outFile = "src/routes.ts",
  include = "**/*.tsx",
  exclude,
  importPrefix = "~/pages",
}: Options = {}) => {
  const ignore = typeof exclude === "string" ? [exclude] : exclude;
  const paths = await glob(include, { cwd: rootDir, ignore });

  const routes = paths.map((path: string) => {
    const trimmedExtnamePath = path.replace(/\.\w+$/, "");
    const indexName = "index";

    const trimmedIndexPath =
      trimmedExtnamePath === indexName || trimmedExtnamePath.endsWith(`/${indexName}`)
        ? trimmedExtnamePath.slice(0, -indexName.length)
        : trimmedExtnamePath;

    const pathname = `/${trimmedIndexPath}`;
    const name = `Route${pascalCase(trimmedExtnamePath)}`;
    const importPath = `${importPrefix}/${trimmedExtnamePath}`;
    const isDynamic = /\[\w+\]/.test(pathname);
    const params: string[] = [];

    const regExp = `()${trimmedIndexPath.replaceAll("/", "\\/").replace(/\[(\w+)\]/g, (_, param) => {
      params.push(param);
      return "([^/]+)";
    })}`;

    const type = params.length ? `{${params.map((param) => `${param}:string`).join()}}` : "Record<string, unknown>";

    const rank = trimmedIndexPath
      .split("/")
      .map((segment) =>
        !/\[\w+\]/.test(segment) ? 9 : /^\[\w+\]/.test(segment) ? 8 : segment.split(/\[(\w+)\]/).length,
      )
      .join("");

    const route = `\`${pathname.replace(/\[\w+\]/g, `$\${SafeSlug<T>}`)}\``;

    return { path, name, type, pathname, importPath, isDynamic, params, regExp, rank, route };
  });

  const staticRoutes = routes.filter(({ isDynamic }) => !isDynamic);

  const dynamicRoutes = routes
    .filter(({ isDynamic }) => isDynamic)
    .sort((a, b) => (a.rank < b.rank ? 1 : a.rank > b.rank ? -1 : 0));

  const code = `
    /* eslint-disable */
    import { FC, JSX, lazy } from "react";

    ${routes.map(({ name, type, importPath }) => `const ${name}: FC<${type}> = lazy(() => import(${JSON.stringify(importPath)}))`).join("\n")}

    const staticRoutes: Record<string, FC> = {${staticRoutes
      .map(({ pathname, name }) => `${JSON.stringify(pathname)}:${name}`)
      .join()}}

    const dynamicRoutes: Array<FC<any> | string | undefined> = [,${dynamicRoutes
      .flatMap(({ name, params }) => [name, ...params.map((param) => JSON.stringify(param))])
      .join()}]

    const dynamicRouteRegExp = /^\\/(?:${dynamicRoutes.map(({ regExp }) => regExp).join("|")})$/

    export const match = (pathname: string): [FC | null] | [FC, Record<string, string>] => {
      const StaticRoute = staticRoutes[pathname];

      if (StaticRoute) {
        return [StaticRoute];
      }

      const matches = pathname.match(dynamicRouteRegExp);

      if (!matches) {
        return [null];
      }

      const index = matches.indexOf("");
      const DynamicRoute: FC<Record<string, string>> = dynamicRoutes[index] as any;
      const params: Record<string, string> = {};

      for (let i = index + 1; matches[i] !== undefined; i++) {
        params[(dynamicRoutes as any)[i]] = matches[i];
      }

      return [DynamicRoute, params];
    };

    type SearchOrHash = \`?\${string}\` | \`#\${string}\`;

    type Suffix = "" | SearchOrHash;

    type SafeSlug<S extends string> = S extends \`\${string}/\${string}\`
      ? never
      : S extends \`\${string}\${SearchOrHash}\`
        ? never
        : S extends ""
          ? never
          : S;

    type StaticRoutes = ${staticRoutes.map(({ pathname }) => `"${pathname}"`).join("|") || "never"};

    type DynamicRoutes<T extends string = string> = ${dynamicRoutes.map(({ route }) => `${route}`).join("|") || "never"};

    export type Route<T> =
      | StaticRoutes
      | \`\${StaticRoutes}\${SearchOrHash}\`
      | (T extends \`\${DynamicRoutes<infer _>}\${Suffix}\` ? T : never);
  `;

  const config = await resolveConfig(outFile);
  const formattedCode = await format(code, { ...config, filepath: outFile });
  writeFileSync(outFile, formattedCode);
};
