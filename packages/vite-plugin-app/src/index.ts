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
        const staticPages = {${staticPages.map(({ pathname, name }) => `${JSON.stringify(pathname)}:${name}`).join()}};
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
        const match = (pathname) => {
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
