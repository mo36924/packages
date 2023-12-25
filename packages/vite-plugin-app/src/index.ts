import { dirname, relative } from "node:path";
import { pascalCase } from "change-case";
import fastGlob from "fast-glob";
import { PluginOption } from "vite";
import solid from "vite-plugin-solid";

const glob = fastGlob.glob;
const virtualPath = "__render.tsx";
const dir = "pages";
const addDot = (path: string) => path.replace(/^[^\.]/, "./$&");
const normalizePath = (path: string) => path.replaceAll("\\", "/");
const trimExtname = (path: string) => path.replace(/\.\w+$/, "");
const trimIndex = (path: string) => path.replace(/\/index$/, "/");
const importDirPath = addDot(normalizePath(relative(dirname(virtualPath), dir)));

export default (): PluginOption => [
  {
    name: "@mo36924/vite-plugin-app",
    resolveId(source) {
      if (source === virtualPath) {
        return virtualPath;
      }
    },
    async load(id) {
      if (id !== virtualPath) {
        return;
      }

      const paths = await glob("**/*.[jt]sx", { cwd: dir });

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
      return () => {
        server.middlewares.use(async (req, res, next) => {
          if (req.url !== "/index.html") {
            next();
          }

          try {
            const { render } = await server.ssrLoadModule(virtualPath);
            const html = await render(req.originalUrl ?? "/");
            res.setHeader("Content-Type", "text/html; charset=UTF-8");
            res.end(html);
          } catch {
            next();
          }
        });
      };
    },
  },
  solid({ ssr: true }),
];
