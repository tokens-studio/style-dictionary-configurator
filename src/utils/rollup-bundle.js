import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import * as rollup from "rollup";
import StyleDictionary from "browser-style-dictionary/browser.js";

/**
 * Somewhat naive bundle step with rollup
 * This will allow relative import specifiers inside the playground
 * Might be nice for JS tokens importing/exporting rather than using
 * the SD {} reference syntax that you can only use inside "value"s
 *
 * EXAMPLE:
 *
 *  import foo from '../foo/bar.js';
 *
 *  export default {
 *    "color": {
 *      ...foo,
 *    }
 *  }
 */
export async function bundle(inputPath) {
  const sdName = uuidv4();
  globalThis[sdName] = StyleDictionary;
  const rollupCfg = await rollup.rollup({
    input: inputPath,
    plugins: [
      {
        name: "resolve-bare-esm-run",
        async resolveId(id) {
          // if id is not relative or absolute or style-dictionary -> bare import to resolve from esm.run
          if (!id.match(/^(\/|\.).+$/g) && id !== "style-dictionary") {
            return { id: `https://esm.run/${id}`, external: true };
          }
          return null;
        },
      },
      {
        name: "fake-import",
        resolveId(source, importer) {
          let resolved;
          if (source === inputPath) {
            resolved = inputPath;
          } else if (importer) {
            // try to resolve it from our virtual FS
            resolved = path.resolve(path.dirname(importer), source);
          }
          return resolved;
        },
        load(id) {
          if (id) {
            // try to load it from our virtual FS
            return fs.readFileSync(id, "utf-8");
          }
        },
      },
      {
        name: "sd-external",
        // Naive and simplified regex version of rollup externals global plugin just for style-dictionary import..
        transform(code) {
          let rewrittenCode = code;
          let matchRes = rewrittenCode.match(
            /import (?<id>.+?) from 'style-dictionary';/,
            ""
          );
          if (matchRes) {
            let { id } = matchRes.groups;
            // Remove the import statement, replace the id wherever used with the global
            rewrittenCode = rewrittenCode
              .replace(matchRes[0], "")
              .replace(new RegExp(id, "g"), `globalThis['${sdName}']`);
          }
          return rewrittenCode;
        },
      },
    ],
  });
  const bundle = await rollupCfg.generate({ format: "es" });
  return bundle.output[0].code;
}
