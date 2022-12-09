import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import * as rollup from "rollup";
import StyleDictionary from "browser-style-dictionary/browser.js";
import {
  repopulateFileTree,
  getInputFiles,
} from "./file-tree/file-tree-utils.js";
import { configPaths, encodeContents } from "./index.js";

export let styleDictionaryInstance;
let sdInstanceSetResolve;
export const styleDictionaryInstanceSet = new Promise((resolve) => {
  sdInstanceSetResolve = resolve;
});

async function cleanPlatformOutputDirs() {
  if (!styleDictionaryInstance || !styleDictionaryInstance.platforms) {
    return;
  }
  const foldersToClean = new Set();
  Object.entries(styleDictionaryInstance.platforms).map(([key, val]) => {
    foldersToClean.add(val.buildPath.split("/")[0]);
  });

  await Promise.all(
    Array.from(foldersToClean).map((folder) => {
      return new Promise((resolve) => {
        fs.rmdir(folder, { recursive: true }, () => {
          resolve();
        });
      });
    })
  );
}

export async function rerunStyleDictionaryIfSourceChanged(
  file,
  isFolder = false
) {
  const previousRunError = !styleDictionaryInstance;

  // If previous run was okay, check whether we need a new run
  if (!previousRunError) {
    const inputFiles = await getInputFiles();
    const isInputFile = inputFiles.includes(file.replace(/^\//, ""));
    // Only run style dictionary if the config or input files were changed
    if (!isInputFile && !isFolder) {
      return;
    }
  }
  await runStyleDictionary();

  const inputFiles = await getInputFiles();
  // If no inputFiles, run was error so can't send something useful to analytics atm or encode contents in url
  if (inputFiles.length > 0) {
    // We use fathom for analytics, here we track dictionary runs
    window.fathom.trackGoal("XBWJBW1W", 0);
    const encoded = await encodeContents(inputFiles);
    window.location.href = `${window.location.origin}/#project=${encoded}`;
  }
}

export function findUsedConfigPath() {
  return configPaths.find((cfgPath) => fs.existsSync(cfgPath));
}

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
async function bundle(inputPath) {
  const sdName = uuidv4();
  globalThis[sdName] = StyleDictionary;
  const rollupCfg = await rollup.rollup({
    input: inputPath,
    plugins: [
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

export default async function runStyleDictionary() {
  console.log("Running style-dictionary...");
  document.querySelector("#output-file-tree").animateCue();
  await cleanPlatformOutputDirs();
  let cfgObj;
  const configPath = findUsedConfigPath();
  let newStyleDictionary = {};
  try {
    // If .js, we need to parse it as actual JS without resorting to eval/Function
    // Instead, we put it in a blob and create a URL from it that we can import
    // That way, malicious code would be scoped only to the blob, which is safer.
    if (configPath.match(/\.(j|mj)s$/)) {
      const bundled = await bundle(configPath);
      const url = URL.createObjectURL(
        new Blob([bundled], { type: "text/javascript" })
      );
      const { default: cfg } = await import(url);
      cfgObj = cfg;
    } else {
      cfgObj = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    }

    // Custom parser for JS files
    cfgObj.parsers = [
      ...(cfgObj.parsers || []),
      {
        // matches js, mjs
        pattern: /\.(j|mj)s$/,
        parse: async ({ filePath }) => {
          const bundled = await bundle(filePath);
          const url = URL.createObjectURL(
            new Blob([bundled], { type: "text/javascript" })
          );
          const { default: token } = await import(url);
          return token;
        },
      },
    ];

    newStyleDictionary = await StyleDictionary.extend(cfgObj);
    styleDictionaryInstance = newStyleDictionary;
    sdInstanceSetResolve();
    await newStyleDictionary.buildAllPlatforms();
  } catch (e) {
    console.error(`Style Dictionary error: ${e.stack}`);
  } finally {
    await repopulateFileTree();
    return newStyleDictionary;
  }
}
