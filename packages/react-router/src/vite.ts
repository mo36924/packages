import { existsSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { pascalCase } from "@mo36924/change-case";
import glob from "fast-glob";
import pluralize from "pluralize";
import { createMatchPath, loadConfig } from "tsconfig-paths";
import { Plugin } from "vite";
import { name } from "./name";

export type GenerateOptions = {
  include?: string[];
  exclude?: string[];
  importPrefix?: string;
  routesDir?: string;
};

const dir = dirname(fileURLToPath(import.meta.url));
const filenames = ["js", "cjs"].map((ext) => join(dir, `index.${ext}`));

const getDefaultImportPrefix = (routesDir: string) => {
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

  return relative(dir, routesDir).replace(/^(?!\.)/, "./");
};

const getGenerateOptions = ({
  include = ["**/*.tsx"],
  exclude = [],
  routesDir = "src/routes",
  importPrefix = getDefaultImportPrefix(routesDir),
}: GenerateOptions = {}): Required<GenerateOptions> => ({
  include,
  exclude,
  importPrefix,
  routesDir,
});

export const generateRoutesCode = async (options?: GenerateOptions & { ssr?: boolean }) => {
  const ssr = options?.ssr;
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
    ${
      ssr
        ? routes.map(({ name, importPath }) => `import ${name} from ${JSON.stringify(importPath)}`).join("\n")
        : `
          import { lazy, Suspense } from "react"
          ${routes
            .map(({ name, importPath }) => `const ${name} = lazy(() => import(${JSON.stringify(importPath)}))`)
            .join("\n")}
        `
    }
    
    const staticRoutes = {${staticRoutes.map(({ pathname, name }) => `${JSON.stringify(pathname)}:${name}`).join()}}

    const dynamicRoutes = [,${dynamicRoutes
      .flatMap(({ name, params }) => [`${name}`, ...params.map((param) => JSON.stringify(param))])
      .join()}]

    const dynamicRouteRegExp = /^\\/(?:${dynamicRoutes.map(({ regExp }) => regExp).join("|")})$/

    export const match = (pathname) => {
      const StaticRoute = staticRoutes[pathname];

      if (StaticRoute) {
        return [StaticRoute];
      }

      const matches = pathname.match(dynamicRouteRegExp);

      if (!matches) {
        return [null];
      }

      const index = matches.indexOf("");
      const DynamicRoute = dynamicRoutes[index];
      const params: Record<string, string> = {};

      for (let i = index + 1; matches[i] !== undefined; i++) {
        params[(dynamicRoutes)[i]] = matches[i];
      }

      return [DynamicRoute, params];
    };

    const Router = (props) => {
      const [Route, params] = match(props.pathname);
      return Route && ${ssr ? "<Route {...params} />" : "<Suspense><Route {...params} /></Suspense>"};
    };

    export default Router;
  `;

  return code;
};

export default (options?: GenerateOptions): Plugin => {
  const generateOptions = getGenerateOptions(options);
  return {
    name,
    load(id, { ssr } = {}) {
      if (!filenames.includes(id)) {
        return;
      }

      return generateRoutesCode({ ...generateOptions, ssr });
    },
  };
};
