import { readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { cwd as _cwd } from "node:process";
import t from "@babel/types";
import { pascalCase } from "change-case";
import fastGlob from "fast-glob";
import autoImport from "unplugin-auto-import/vite";
import { Manifest, PluginOption, ResolvedConfig, UserConfig, build } from "vite";
import solid from "vite-plugin-solid";

const cwd = _cwd();
const glob = fastGlob.glob;
const serverEntryId = "__server.js";
const clientEntryId = "__clinet.js";
const serverRenderId = "__render.js";
const routerId = "__router.jsx";
const clientEntryPathname = `/${clientEntryId}`;
const pagesDir = "src/pages";
const absolutePagesDir = resolve(pagesDir) + sep;
const includePagesDir = (path: string) => path.startsWith(absolutePagesDir);
const addDot = (path: string) => path.replace(/^[^\.]/, "./$&");
const normalizePath = (path: string) => path.replaceAll("\\", "/");
const trimExtname = (path: string) => path.replace(/\.\w+$/, "");
const trimIndex = (path: string) => path.replace(/\/index$/, "/");
const importDirPath = addDot(normalizePath(relative(dirname(routerId), pagesDir)));
let manifest: Manifest = { "": { file: clientEntryId, isEntry: true } };
let config: ResolvedConfig;

export default (): PluginOption => [
  autoImport({
    imports: ["solid-js", { "solid-js/web": ["HydrationScript"] }],
    ignore: ["children"],
  }),
  solid({
    ssr: true,
    babel: {
      plugins: [
        {
          visitor: {
            JSXElement(path, state) {
              path.traverse({
                JSXElement(path) {
                  const openingElement = path.get("openingElement");
                  const name = openingElement.get("name");

                  if (name.isJSXIdentifier({ name: "head" })) {
                    const filename = relative(cwd, state.filename);
                    const deps = Object.values(manifest).filter(({ isEntry, src }) => isEntry || src === filename);

                    path.pushContainer("children", [
                      ...deps.map(({ file }) =>
                        t.jsxElement(
                          t.jsxOpeningElement(t.jsxIdentifier("script"), [
                            t.jsxAttribute(t.jsxIdentifier("type"), t.stringLiteral("module")),
                            t.jsxAttribute(t.jsxIdentifier("src"), t.stringLiteral(`/${file}`)),
                          ]),
                          null,
                          [],
                        ),
                      ),
                      ...deps.flatMap(({ css = [] }) =>
                        css.map((file) =>
                          t.jsxElement(
                            t.jsxOpeningElement(t.jsxIdentifier("link"), [
                              t.jsxAttribute(t.jsxIdentifier("rel"), t.stringLiteral("stylesheet")),
                              t.jsxAttribute(t.jsxIdentifier("href"), t.stringLiteral(`/${file}`)),
                            ]),
                            null,
                            [],
                          ),
                        ),
                      ),
                      t.jsxElement(t.jsxOpeningElement(t.jsxIdentifier("HydrationScript"), []), null, []),
                    ]);
                  }
                },
              });
            },
          },
        },
      ],
    },
  }),
  {
    name: "@mo36924/vite-plugin-app",
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
          rollupOptions: { input: isSsrBuild ? serverEntryId : clientEntryId, preserveEntrySignatures: false },
        },
      };
    },
    configResolved(resolvedConfig) {
      config = resolvedConfig;

      if (config.build.ssr) {
        manifest = JSON.parse(readFileSync(join(config.build.outDir, "manifest.json"), "utf-8"));
      }
    },
    resolveId(source) {
      switch (source) {
        case serverEntryId:
        case clientEntryId:
        case serverRenderId:
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
          serve({ async fetch(request){
            const { pathname } = new URL(request.url)
            const html = await render(pathname)
            return new Response(html, { headers: [["Content-Type", "text/html; charset=UTF-8"]] })
          } })
        `;
      }

      if (id === clientEntryId) {
        return `
          import { hydrate } from "solid-js/web"
          import { match } from "${routerId}"
          hydrate(match(location.pathname), document)
        `;
      }

      if (id === serverRenderId) {
        return `
          import { renderToStringAsync } from "solid-js/web"
          import { match } from "${routerId}"
          export const render = async (pathname) => {
            const html = await renderToStringAsync(match(pathname))
            return \`<!DOCTYPE html>\${html}\`
          }
        `;
      }

      if (id === routerId) {
        const paths = await glob("**/*.[jt]sx", { cwd: pagesDir });

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

        const code = `
          import { renderToStringAsync } from "solid-js/web";
          ${pages.map(({ name, importPath }) => `import ${name} from ${JSON.stringify(importPath)};`).join("")}
          const staticPages = {${staticPages
            .map(({ pathname, name }) => `${JSON.stringify(pathname)}:${name}`)
            .join()}};
          ${
            dynamicPages.length
              ? `
          const dynamicPageRegExp = /^(?:${dynamicPages.map(({ regExp }) => regExp).join("|")})$/
          const dynamicPages = [,${dynamicPages
            .flatMap(({ name, params }) => [name, ...params.map((param) => JSON.stringify(param))])
            .join()}]
          `
              : ""
          }
          export const match = (pathname) => {
            const StaticPage = staticPages[pathname]
            if(StaticPage){
              return () => <StaticPage />
            }
            ${
              dynamicPages.length
                ? `
            const matches = pathname.match(dynamicPageRegExp)
            if(!matches){
              return () => <div>404 Not Found</div>
            }
            const index = matches.indexOf(pathname, 1)
            const DynamicPage = dynamicPages[index]
            const params = {}
            for(let i = index + 1; matches[i] !== undefined; i++){
              params[dynamicPages[i]] = matches[i]
            }
            return () => <DynamicPage {...params} />
            `
                : `
            return () => <div>404 Not Found</div>
            `
            }
            
          }
          export const render = async (pathname) => {
            const fn = match(pathname)
            const html = await renderToStringAsync(fn)
            return \`<!DOCTYPE html>\${html}\`
          }
        `;

        return code;
      }
    },
    async writeBundle() {
      if (!config.build.ssr) {
        await build({ build: { ssr: true } });
      }
    },
    configureServer(server) {
      const onRename = async (path: string) => {
        if (!includePagesDir(path)) {
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
