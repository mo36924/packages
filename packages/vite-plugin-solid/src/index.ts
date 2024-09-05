import { readFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import babelPlugin, { Options as BabelPluginOptions } from "@mo36924/babel-plugin-solid";
import { pascalCase } from "change-case";
import fastGlob from "fast-glob";
import { ExternalOption } from "rollup";
import { Manifest, PluginOption, ResolvedConfig, build, createFilter } from "vite";
import solid from "vite-plugin-solid";

const glob = fastGlob.glob;
const serverEntryId = "__server.jsx";
const serverRenderId = "__render.jsx";
const clientEntryId = "__clinet.jsx";
const routerId = "__router.jsx";
const clientEntryPathname = `/${clientEntryId}`;
const pagesDir = "pages";
const source = `${pagesDir}/**/*.?(c|m)[jt]sx`;
const virtualExtname = "._.jsx";
const isPage = createFilter(source);
const addDot = (path: string) => (path[0] === "." ? path : `./${path}`);
const normalizePath = (path: string) => path.replaceAll("\\", "/");
const trimVirtualExtname = (path: string) => path.replace(/\._\.jsx$/, "");
const trimExtname = (path: string) => path.replace(/\.\w+(\._\.jsx)?$/, "");
const trimIndex = (path: string) => path.replace(/\/index$/, "/");
const importDirPath = addDot(normalizePath(relative(dirname(routerId), pagesDir)));

const getPages = () => glob(source);

const getVirtualPages = async () => {
  const paths = await getPages();
  return paths.map((path) => path + virtualExtname);
};

const pageToRoute = (path: string) => {
  const _basename = basename(path, virtualExtname);
  const normalizedPath = normalizePath(path);
  const trimmedPagesDirPath = normalizedPath.slice(pagesDir.length);
  const trimmedExtnamePath = trimExtname(trimmedPagesDirPath);
  const pathname = trimIndex(trimmedExtnamePath);
  const name = `Page${pascalCase(trimmedExtnamePath)}`;
  const importPath = `${importDirPath}/${trimmedExtnamePath}`;
  const isDynamic = /\[\w+\]/.test(pathname);
  const params: string[] = [];

  const regExp = pathname
    .replaceAll("/", "\\/")
    .replace(/\[(\w+)\]/g, (_, param) => {
      params.push(param);
      return "([^/]+)";
    })
    .replace(/^/, "(")
    .replace(/$/, ")");

  return { basename: _basename, pathname, name, importPath, isDynamic, params, regExp };
};

const normalizeManifest = (manifest: Manifest) =>
  Object.fromEntries(Object.entries(manifest).map(([key, value]) => [trimVirtualExtname(key), value]));

let config: ResolvedConfig;

export type Options = {
  dev?: boolean;
  buildServer?: boolean;
  external?: ExternalOption;
};

export default ({ buildServer = true, external }: Options = {}): PluginOption => {
  const manifest: Manifest = {};
  return [
    solid({
      ssr: true,
      babel: {
        plugins: [[babelPlugin, { manifest } as BabelPluginOptions]],
      },
    }),
    {
      name: "@mo36924/vite-plugin-solid",
      async config(config, { command, isSsrBuild }) {
        if (command !== "build") {
          return config;
        }

        return {
          ...config,
          build: {
            ssr: isSsrBuild,
            manifest: !isSsrBuild && "manifest.json",
            emptyOutDir: !isSsrBuild,
            assetsDir: isSsrBuild ? "" : undefined,
            rollupOptions: {
              input: isSsrBuild ? serverEntryId : await getVirtualPages(),
              preserveEntrySignatures: false,
              external: isSsrBuild ? external : undefined,
            },
          },
        };
      },
      configResolved(resolvedConfig) {
        config = resolvedConfig;

        Object.assign(
          manifest,
          normalizeManifest(
            config.build.ssr
              ? JSON.parse(readFileSync(join(config.build.outDir, "manifest.json"), "utf-8"))
              : { [clientEntryId]: { file: clientEntryId, isEntry: true } },
          ),
        );
      },
      async resolveId(source) {
        switch (source) {
          case serverEntryId:
          case serverRenderId:
          case clientEntryId:
          case routerId:
            return source;
          case clientEntryPathname:
            return clientEntryId;
        }

        if (source.endsWith(virtualExtname)) {
          return source;
        }
      },
      async load(id) {
        if (id === serverEntryId) {
          return `
            import { serve } from "@mo36924/http-server"
            import { render } from "${serverRenderId}"
            const assets = {${Object.values(manifest).map(
              ({ file }) =>
                `${JSON.stringify(`/${file}`)}:${JSON.stringify(
                  readFileSync(join(config.build.outDir, file), "utf-8"),
                )}`,
            )}}
            const jsInit = { headers: new Headers([["Content-Type", "text/javascript"]]) }
            const htmlInit = { headers: new Headers([["Content-Type", "text/html; charset=UTF-8"]]) }
            serve({ async fetch(request){
              const { pathname } = new URL(request.url)
              if(pathname in assets){
                return new Response(assets[pathname], jsInit)
              }
              const html = await render(pathname)
              return new Response(html, htmlInit)
            } })
          `;
        }

        if (id === serverRenderId) {
          return `
            import { renderToStringAsync } from "solid-js/web";
            import { match } from "${routerId}";
            
            export const render = async (pathname) => {
              const html = await renderToStringAsync(match(pathname));
              return "<!DOCTYPE html>" + html;
            };
          `;
        }

        if (id === routerId) {
          const paths = await getPages();
          const pages = paths.map(pageToRoute);
          const staticPages = pages.filter(({ isDynamic }) => !isDynamic);
          const dynamicPages = pages.filter(({ isDynamic }) => isDynamic);

          return `
            ${pages.map(({ name, importPath }) => `import ${name} from ${JSON.stringify(importPath)};`).join("")}
            const staticPages = {${staticPages
              .map(({ pathname, name }) => `${JSON.stringify(pathname)}:${name}`)
              .join()}};
            const dynamicPageRegExp = /^(?:${dynamicPages.map(({ regExp }) => regExp).join("|")})$/
            const dynamicPages = [,${dynamicPages
              .flatMap(({ name, params }) => [name, ...params.map((param) => JSON.stringify(param))])
              .join()}]
            export const match = (pathname) => {
              const StaticPage = staticPages[pathname];
            
              if (StaticPage) {
                return StaticPage;
              }
            
              const matches = pathname.match(dynamicPageRegExp);
            
              if (!matches) {
                return () => <div>404 Not Found</div>;
              }
            
              const index = matches.indexOf(pathname, 1);
              const DynamicPage = dynamicPages[index];
              const params = {};
            
              for (let i = index + 1; matches[i] !== undefined; i++) {
                params[dynamicPages[i]] = matches[i];
              }
            
              return () => <DynamicPage {...params} />;
            };
          `;
        }

        if (id.endsWith(virtualExtname)) {
          const { isDynamic, basename, regExp, params } = pageToRoute(id);

          return isDynamic
            ? `
            import { hydrate } from "solid-js/web";
            import DynamicPage from "./${basename}"
            const matches = location.pathname.match(/^${regExp.slice(1, -1)}$/);
            const params = {${params.map((param, i) => `${param}:matches[${i + 1}]`)}};
            hydrate(() => <DynamicPage {...params} />, document);
          `
            : `
            import { hydrate } from "solid-js/web";
            import StaticPage from "./${basename}"
            hydrate(StaticPage, document);
          `;
        }
      },
      async writeBundle() {
        if (buildServer && !config.build.ssr) {
          await build({ build: { ssr: true } });
        }
      },
      configureServer(server) {
        const onRename = async (path: string) => {
          if (!isPage(path)) {
            return;
          }

          const module = server.moduleGraph.getModuleById(routerId);

          if (module) {
            await server.reloadModule(module);
          }
        };

        server.watcher.on("add", onRename);
        server.watcher.on("addDir", onRename);
        server.watcher.on("unlink", onRename);
        server.watcher.on("unlinkDir", onRename);

        return () => {
          server.middlewares.use(async ({ url, originalUrl = "/" }, res, next) => {
            if (url !== "/index.html") {
              next();
              return;
            }

            try {
              const { render } = await server.ssrLoadModule(serverRenderId);
              const html = await render(originalUrl);
              const transformedHtml = await server.transformIndexHtml(url, html, originalUrl);
              res.setHeader("Content-Type", "text/html; charset=UTF-8");
              res.end(transformedHtml);
            } catch {
              next();
            }
          });
        };
      },
    },
  ];
};
