import { dirname, relative, resolve, sep } from "node:path";
import { pascalCase } from "change-case";
import fastGlob from "fast-glob";
import { PluginOption } from "vite";
import solid from "vite-plugin-solid";

const glob = fastGlob.glob;
const virtualPath = "__render.jsx";
const pagesDir = "src/pages";
const absolutePagesDir = resolve(pagesDir) + sep;
const includePagesDir = (path: string) => path.startsWith(absolutePagesDir);
const addDot = (path: string) => path.replace(/^[^\.]/, "./$&");
const normalizePath = (path: string) => path.replaceAll("\\", "/");
const trimExtname = (path: string) => path.replace(/\.\w+$/, "");
const trimIndex = (path: string) => path.replace(/\/index$/, "/");
const importDirPath = addDot(normalizePath(relative(dirname(virtualPath), pagesDir)));

export default (): PluginOption => [
  {
    name: "@mo36924/vite-plugin-app",
    resolveId(source) {
      if (source === virtualPath) {
        return source;
      }
    },
    async load(id) {
      if (id !== virtualPath) {
        return;
      }

      const paths = await glob("**/*.[jt]sx", { cwd: pagesDir });

      const pages = paths.map((path) => {
        const normalizedPath = normalizePath(path);
        const trimmedExtnamePath = trimExtname(normalizedPath);
        const pathname = trimIndex(`/${trimmedExtnamePath}`);
        const name = `Page${pascalCase(trimmedExtnamePath)}`;
        const importPath = `${importDirPath}/${trimmedExtnamePath}`;
        return { pathname, name, importPath };
      });

      return `
        import { renderToStringAsync } from "solid-js/web";
        ${pages.map(({ name, importPath }) => `import ${name} from ${JSON.stringify(importPath)};`).join("")}
        const routes = {${pages.map(({ pathname, name }) => `${JSON.stringify(pathname)}:${name}`).join()}};
        export const render = async (pathname) => {
          const Page = routes[pathname] || (() => <div />)
          const html = await renderToStringAsync(() => <Page />)
          return \`<!DOCTYPE html>\${html}\`
        }
      `;
    },
    configureServer(server) {
      const onRename = async (path: string) => {
        if (!includePagesDir(path)) {
          return;
        }

        const module = server.moduleGraph.getModuleById(virtualPath);

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
            const { render } = await server.ssrLoadModule(virtualPath);
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
  solid({ ssr: true }),
];
