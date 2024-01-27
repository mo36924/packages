import { readFileSync } from "node:fs";
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
const clientEntryPathname = `/${clientEntryId}`;
const pagesDir = "pages";
const source = "**/*.?(c|m)[jt]sx";
const isPage = createFilter(`${pagesDir}/${source}`);
const addDot = (path: string) => (path[0] === "." ? path : `./${path}`);
const normalizePath = (path: string) => path.replaceAll("\\", "/");
const trimExtname = (path: string) => path.replace(/\.\w+$/, "");
const trimIndex = (path: string) => path.replace(/\/index$/, "/");
const importDirPath = addDot(normalizePath(relative(dirname(routerId), pagesDir)));
let config: ResolvedConfig;

export type Options = {
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
      resolveId(source) {
        switch (source) {
          case serverEntryId:
          case serverRenderId:
          case clientEntryId:
          case routerId:
            return source;
          case clientEntryPathname:
            return clientEntryId;
        }
      },
      async load(id) {
        if (id === serverEntryId) {
          return `
          import { serve } from "@mo36924/http-server"
          import { render } from "${serverRenderId}"
          const assets = {${Object.values(manifest).map(
            ({ file }) =>
              `${JSON.stringify(`/${file}`)}:${JSON.stringify(readFileSync(join(config.build.outDir, file), "utf-8"))}`,
          )}}
          serve({ async fetch(request){
            const { pathname } = new URL(request.url)
            if(pathname in assets){
              return new Response(assets[pathname], { headers: [["Content-Type", "text/javascript"]] })
            }
            const html = await render(pathname)
            return new Response(html, { headers: [["Content-Type", "text/html; charset=UTF-8"]] })
          } })
        `;
        }

        if (id === serverRenderId) {
          return `
          import { renderToStringAsync } from "solid-js/web";
          import { match } from "${routerId}";
          
          export const render = async (pathname) => {
            const html = await renderToStringAsync(match(pathname), { renderId: "0-" });
            return "<!DOCTYPE html>" + html;
          };
        `;
        }

        if (id === clientEntryId) {
          return `
          import { createSignal } from "solid-js";
          import { Dynamic, hydrate } from "solid-js/web";
          import { match } from "${routerId}";

          const origin = location.origin + "/";
          const [pathname, setPathname] = createSignal(location.pathname);

          const onchangestate = () => {
            setPathname(location.pathname);
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

          hydrate(() => <Dynamic component={match(pathname())} />, document);
        `;
        }

        if (id === routerId) {
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

          return `
          import { renderToStringAsync } from "solid-js/web";
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
