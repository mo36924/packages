import { existsSync, FSWatcher, watch, writeFileSync } from "node:fs";
import { basename, dirname, relative, resolve } from "node:path";
import { pascalCase } from "@mo36924/change-case";
import glob from "fast-glob";
import MagicString from "magic-string";
import pluralize from "pluralize";
import { createMatchPath, loadConfig } from "tsconfig-paths";
import { Plugin } from "vite";
import { name } from "./name";

export type GenerateOptions = {
  include?: string[];
  exclude?: string[];
  importPrefix?: string;
  routesDir?: string;
  routerPath?: string;
  prettier?: boolean;
};

const getDefaultImportPrefix = (routesDir: string, routerPath: string) => {
  const config = loadConfig();

  if (config.resultType === "success") {
    const pathKeys = Object.keys(config.paths);

    if (pathKeys.length) {
      const matchPath = createMatchPath(config.absoluteBaseUrl, config.paths, config.mainFields, config.addMatchAll);

      for (const pathKey of pathKeys) {
        const routesDirName = basename(routesDir);
        const requestedModule = pathKey.replace("*", routesDirName);

        if (matchPath(requestedModule, undefined, existsSync, [])) {
          return requestedModule;
        }
      }
    }
  }

  return relative(dirname(routerPath), routesDir).replace(/^(?!\.)/, "./");
};

const getGenerateOptions = ({
  include = ["**/*.tsx"],
  exclude = [],
  routesDir = "src/routes",
  routerPath = "src/components/Router.tsx",
  prettier = true,
  importPrefix = getDefaultImportPrefix(routesDir, routerPath),
}: GenerateOptions = {}): Required<GenerateOptions> => ({
  include,
  exclude,
  importPrefix,
  routesDir,
  routerPath,
  prettier,
});

export const generateRoutesCode = async (options?: GenerateOptions) => {
  const generateOptions = getGenerateOptions(options);
  const { include, exclude, routesDir, importPrefix } = generateOptions;
  const paths = await glob(include, { cwd: routesDir, ignore: exclude });
  const routesDirName = basename(routesDir);
  const namePrefix = pascalCase(pluralize.singular(routesDirName));

  const routes = paths.sort().map((path: string) => {
    const trimmedExtnamePath = path.replace(/\.\w+$/, "");
    const trimmedIndexPath = trimmedExtnamePath.replace(/(^|\/)index$/, "");
    const pathname = `/${trimmedIndexPath}`;
    const name = `${namePrefix}${pascalCase(trimmedExtnamePath)}`;
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
    /* eslint-disable eslint-comments/no-unlimited-disable */
    /* eslint-disable */
    import { FC, Suspense } from "react"
    ${routes.map(({ name, importPath }) => `import ${name} from ${JSON.stringify(importPath)}`).join("\n")}

    const staticRoutes: Record<string, FC> = {${staticRoutes
      .map(({ pathname, name }) => `${JSON.stringify(pathname)}:${name}`)
      .join()}}

    const dynamicRoutes: Array<FC<any> | string | undefined> = [,${dynamicRoutes
      .flatMap(({ name, type, params }) => [
        `${name} satisfies FC<${type}>`,
        ...params.map((param) => JSON.stringify(param)),
      ])
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

    type DynamicRoutes<T extends string = string> = ${dynamicRoutes.map(({ route }) => `${route}`).join("|") || 'T extends "" ? SafeSlug<T> : never'};

    export type Route<T> =
      | StaticRoutes
      | \`\${StaticRoutes}\${SearchOrHash}\`
      | (T extends \`\${DynamicRoutes<infer _>}\${Suffix}\` ? T : never);

    const Router = ({ pathname }: { pathname: string }) => {
      const [Route, params] = match(pathname);
      return (
        Route && (
          <Suspense>
            <Route {...params} />
          </Suspense>
        )
      );
    };

    export default Router;
  `;

  return code;
};

export const generateRoutesFile = async (options?: GenerateOptions) => {
  const generateOptions = getGenerateOptions(options);
  const { routerPath } = generateOptions;
  let code = await generateRoutesCode(generateOptions);

  if (generateOptions.prettier) {
    const { format, resolveConfig } = await import("prettier");
    const config = await resolveConfig(routerPath);
    code = await format(code, { ...config, filepath: routerPath });
  }

  writeFileSync(routerPath, code);
};

export default (options?: GenerateOptions): Plugin => {
  const generateOptions = getGenerateOptions(options);
  const _generateRoutesFile = generateRoutesFile.bind(null, generateOptions);
  const routesPath = resolve(generateOptions.routerPath);
  const _globalThis: { watcher?: FSWatcher } = globalThis as any;
  return {
    name,
    async config(_config, { isSsrBuild }) {
      if (!isSsrBuild) {
        await _generateRoutesFile();
      }
    },
    async configResolved({ command }) {
      if (command !== "build") {
        _globalThis.watcher?.close();
        _globalThis.watcher = watch(generateOptions.routesDir, _generateRoutesFile);
      }
    },
    transform(code, id, { ssr } = {}) {
      if (id !== routesPath || ssr) {
        return;
      }

      const s = new MagicString(code);
      s.prepend("import { lazy } from 'react'\n");
      s.replaceAll(/import (\w+) from (['"].+?['"])/g, (_, p1, p2) => `const ${p1} = lazy(() => import(${p2}))`);
      return { code: s.toString(), map: s.generateMap({ hires: true }) };
    },
  };
};
