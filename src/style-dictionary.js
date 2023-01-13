import fs from "fs";

import StyleDictionary from "browser-style-dictionary/browser.js";
import {
  repopulateFileTree,
  getInputFiles,
  fileTreeEl,
  currentFileOutput,
} from "./file-tree/file-tree-utils.js";
import { bundle } from "./utils/rollup-bundle.js";
import { findUsedConfigPath } from "./utils/findUsedConfigPath.js";
import { encodeContents } from "./index.js";

/**
 * Small State object for getting/setting the current style-dictionary object.
 * Also allows subscribing to changes or awaiting initial setting of the object.
 */
class SdState extends EventTarget {
  constructor() {
    super();
    this._sd = undefined;
    this.hasInitializedConfig = new Promise((resolve) => {
      this.hasInitializedConfigResolve = resolve;
    });
    this.hasInitialized = new Promise((resolve) => {
      this.hasInitializedResolve = resolve;
    });
  }

  get config() {
    return this._config;
  }

  set config(v) {
    this._config = v;
    this.hasInitializedConfigResolve();
    this.dispatchEvent(new CustomEvent("config-changed", { detail: v }));
  }

  get sd() {
    return this._sd;
  }

  set sd(v) {
    this._sd = v;
    this.hasInitializedResolve();
    this.dispatchEvent(new CustomEvent("sd-changed", { detail: v }));
  }

  async rerunStyleDictionary() {
    await this.runStyleDictionary();

    const inputFiles = await getInputFiles();
    // If no inputFiles, run was error so can't send something useful to analytics atm or encode contents in url
    if (inputFiles.length > 0) {
      const encoded = await encodeContents(inputFiles);
      window.location.href = `${window.location.origin}/#project=${encoded}`;
    }
    // refresh currently selected output file
    fileTreeEl.switchToFile(currentFileOutput);
  }

  async runStyleDictionary() {
    console.log("Running style-dictionary...");
    document.querySelector("#output-file-tree").animateCue();
    await this.cleanPlatformOutputDirs();
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
      // cfgObj.parsers = [
      //   ...(cfgObj.parsers || []),
      //   {
      //     // matches js, mjs
      //     pattern: /\.(j|mj)s$/,
      //     parse: async ({ filePath }) => {
      //       const bundled = await bundle(filePath);
      //       const url = URL.createObjectURL(
      //         new Blob([bundled], { type: "text/javascript" })
      //       );
      //       const { default: token } = await import(url);
      //       return token;
      //     },
      //   },
      // ];

      this.config = cfgObj;
      newStyleDictionary = await StyleDictionary.extend(cfgObj);
      this.sd = newStyleDictionary;
      await this.sd.buildAllPlatforms();
    } catch (e) {
      console.error(`Style Dictionary error: ${e.stack}`);
    } finally {
      await repopulateFileTree();
      return newStyleDictionary;
    }
  }

  async cleanPlatformOutputDirs() {
    if (!this.sd || !this.sd.platforms) {
      return;
    }
    const foldersToClean = new Set();
    Object.entries(this.sd.platforms).map(([, val]) => {
      if (val.buildPath) {
        foldersToClean.add(val.buildPath.split("/")[0]);
      }
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
}

export const sdState = new SdState();
