import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
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
const routerUnhydratableId = "__router._.jsx";
const clientEntryPathname = `/${clientEntryId}`;
const pagesDir = "pages";
const source = "**/*.?(c|m)[jt]sx";
const isPage = createFilter(`${pagesDir}/${source}`);
const addDot = (path: string) => (path[0] === "." ? path : `./${path}`);
const normalizePath = (path: string) => path.replaceAll("\\", "/");
const trimExtname = (path: string) => path.replace(/\.\w+$/, "");
const trimIndex = (path: string) => path.replace(/\/index$/, "/");
const importDirPath = addDot(normalizePath(relative(dirname(routerId), pagesDir)));
const hydratableJsxRegExp = /\.[cm]?[jt]sx$/;
const unhydratableJsxRegExp = /\._(\.[cm]?[jt]sx)$/;
const isHydratableJsx = (path: string) => hydratableJsxRegExp.test(path);
const isUnhydratableJsx = (path: string) => unhydratableJsxRegExp.test(path);
const toHydratableJsx = (path: string) => path.replace(unhydratableJsxRegExp, "$1");
const toUnhydratableJsx = (path: string) => path.replace(hydratableJsxRegExp, "._$&");

let config: ResolvedConfig;

export type Options = {
  buildServer?: boolean;
  external?: ExternalOption;
};
export default ({ buildServer = true, external }: Options = {}): PluginOption => {
  const manifest: Manifest = {};
  return [
    {
      name: "@mo36924/vite-plugin-solid",
      enforce: "pre",
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
              input: isSsrBuild ? serverEntryId : clientEntryId,
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
          config.build.ssr
            ? JSON.parse(readFileSync(join(config.build.outDir, "manifest.json"), "utf-8"))
            : { [clientEntryId]: { file: clientEntryId, isEntry: true } },
        );
      },
      async resolveId(source, importer) {
        switch (source) {
          case serverEntryId:
          case serverRenderId:
          case clientEntryId:
          case routerId:
          case routerUnhydratableId:
            return source;
          case clientEntryPathname:
            return clientEntryId;
        }

        if (importer && isUnhydratableJsx(importer)) {
          const resolved = await this.resolve(source, importer);

          if (resolved && isHydratableJsx(resolved.id)) {
            return {
              ...resolved,
              id: toUnhydratableJsx(resolved.id),
            };
          }
        }
      },
      async load(id, options) {
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

        if (id === clientEntryId) {
          return `
            import { createReaction, createSignal } from "solid-js";
            import { Dynamic, hydrate, render } from "solid-js/web";
            import { match } from "${routerId}";
            import { match as _match } from "${routerUnhydratableId}";

            let init = true
            const origin = location.origin + "/";
            const initialPathname = location.pathname;
            const [pathname, setPathname] = createSignal(initialPathname);

            const onchangestate = () => {
              const _pathname = setPathname(location.pathname)
              if(init && _pathname !== initialPathname){
                init = false
                document.body.innerHTML = ""
                render(() => <Dynamic component={_match(pathname())} />, document.body);
              }
            };

            addEventListener("popstate", onchangestate);

            addEventListener("click", (e) => {
              if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.button) {
                return;
              }

              let t = e.target;

              do {
                if (t.nodeName[0] === "A") {
                  if (!t.hasAttribute("download") && t.getAttribute("rel") !== "external" && t.href.startsWith(origin)) {
                    e.preventDefault();
                    history.pushState(null, "", t.href);
                    onchangestate();
                  }

                  return;
                }
              } while ((t = t.parentNode));
            });

            hydrate(match(initialPathname), document);
          `;
        }

        if (id === routerId || id === routerUnhydratableId) {
          const paths = await glob(source, { cwd: pagesDir });

          const pages = paths.map((path) => {
            const normalizedPath = normalizePath(path);
            const trimmedExtnamePath = trimExtname(normalizedPath);
            const pathname = trimIndex(`/${trimmedExtnamePath}`);
            const name = `Page${pascalCase(trimmedExtnamePath)}`;
            const importPath = `${importDirPath}/${trimmedExtnamePath}`;
            return { pathname, name, importPath, isDynamic: /\[(\w+)\]/.test(pathname) };
          });

          const staticPages = pages.filter(({ isDynamic }) => !isDynamic);

          const dynamicPages = pages
            .filter(({ isDynamic }) => isDynamic)
            .map(({ pathname, name }) => {
              const params: string[] = [];

              const regExp = pathname
                .replaceAll("/", "\\/")
                .replace(/\[(\w+)\]/g, (_, param) => {
                  params.push(param);
                  return "([^/]+)";
                })
                .replace(/^/, "(")
                .replace(/$/, ")");

              return { name, params, regExp };
            });

          const ssr = !!options?.ssr;

          return `
            ${ssr ? "" : `import { lazy } from "solid-js";`}
            ${pages
              .map(({ name, importPath }) =>
                ssr
                  ? `import ${name} from ${JSON.stringify(importPath)};`
                  : `const ${name} = lazy(() => import(${JSON.stringify(importPath)}));`,
              )
              .join("")}
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

        if (isUnhydratableJsx(id)) {
          const code = await readFile(toHydratableJsx(id), "utf-8");
          return code;
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
    solid({
      ssr: false,
      babel: {
        plugins: [[babelPlugin, { ssr: false, manifest } as BabelPluginOptions]],
      },
      include: unhydratableJsxRegExp,
    }),
    solid({
      ssr: true,
      babel: {
        plugins: [[babelPlugin, { ssr: true, manifest } as BabelPluginOptions]],
      },
      exclude: unhydratableJsxRegExp,
    }),
  ];
};
