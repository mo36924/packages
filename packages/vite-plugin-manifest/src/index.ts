import { Manifest, Plugin } from "vite";

const manifestPath = "manifest.json";
const _globalThis: { manifest?: Manifest } = globalThis as any;

export default ({ manifest }: { manifest: Manifest }): Plugin => {
  return {
    name: "manifest",
    config: () => ({ build: { manifest: manifestPath } }),
    options() {
      if (_globalThis.manifest) {
        Object.keys(manifest).forEach((key) => delete manifest[key]);
        Object.assign(manifest, _globalThis.manifest);
      }
    },
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        if (bundle[manifestPath]?.type === "asset") {
          _globalThis.manifest = JSON.parse(`${bundle[manifestPath].source}`);
          delete bundle[manifestPath];
        }
      },
    },
  };
};
