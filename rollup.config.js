import { rollupPluginHTML as html } from "@web/rollup-plugin-html";
import { importMetaAssets } from "@web/rollup-plugin-import-meta-assets";
import nodeResolve from "@rollup/plugin-node-resolve";

export default {
  input: "./index.html",
  output: {
    dir: "dist",
  },
  plugins: [html(), importMetaAssets(), nodeResolve()],
};
