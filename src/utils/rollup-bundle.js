import { posix as path } from "path-unified";
import fs from "@bundled-es-modules/memfs";
import { v4 as uuidv4 } from "uuid";
import { rollup } from "@rollup/browser";
import StyleDictionary from "style-dictionary";
import * as sdFs from "style-dictionary/fs";
import * as sdUtils from "style-dictionary/utils";

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
export async function bundle(inputPath, _fs = fs) {
  const sdName = uuidv4();
  const sdFsName = uuidv4();
  const sdUtilsName = uuidv4();
  globalThis[sdName] = StyleDictionary;
  globalThis[sdFsName] = sdFs;
  globalThis[sdUtilsName] = sdUtils;

  const rollupCfg = await rollup({
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
            return _fs.readFileSync(id, "utf-8");
          }
        },
      },
      {
        name: "sd-external",
        // Naive and simplified regex version of rollup externals global plugin just for style-dictionary imports..
        transform(code) {
          let rewrittenCode = code;
          const reg =
            /import (?<id>.+?) from [',"]style-dictionary(?<entrypoint>\/.+?)?[',"];?/;
          let matchRes;
          while ((matchRes = reg.exec(rewrittenCode)) !== null) {
            let { id, entrypoint } = matchRes.groups;
            let namedImport = id;
            let replacement;

            if (id.startsWith("{") && id.endsWith("}") && entrypoint) {
              namedImport = namedImport
                .replace("{", "")
                .replace("}", "")
                .trim();
              const entry = entrypoint.replace(/^\//, "");

              if (entry === "fs") {
                replacement = `globalThis['${sdFsName}']['${namedImport}']`;
              } else if (entry === "utils") {
                replacement = `globalThis['${sdUtilsName}']['${namedImport}']`;
              }
            } else {
              // Remove the import statement, replace the id wherever used with the global
              replacement = `globalThis['${sdName}']`;
            }
            rewrittenCode = rewrittenCode
              .replace(matchRes[0], "")
              .replace(new RegExp(namedImport, "g"), replacement);
          }

          return rewrittenCode;
        },
      },
    ],
  });
  const bundle = await rollupCfg.generate({ format: "es" });
  return bundle.output[0].code;
}
