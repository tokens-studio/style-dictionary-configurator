import fs, { promises } from "fs";
import StyleDictionary from "browser-style-dictionary/browser.js";
import {
  repopulateFileTree,
  getInputFiles,
  fileTreeEl,
  currentFileOutput,
} from "./file-tree/file-tree-utils.js";
import { registerTransforms } from "@tokens-studio/sd-transforms";
import { bundle } from "./utils/rollup-bundle.js";
import { findUsedConfigPath } from "./utils/findUsedConfigPath.js";
import { encodeContents } from "./index.js";

registerTransforms(StyleDictionary);

/**
 * Small State object for getting/setting the current style-dictionary object.
 * Also allows subscribing to changes or awaiting initial setting of the object.
 */
class SdState extends EventTarget {
  constructor() {
    super();
    this._sd = [];
    this.themes = {};
    this.themedConfigs = [];
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

  async processConfig(_config) {
    let config = _config;
    const configAsString = JSON.stringify(config);

    // Detection of tokens studio using themes
    // This means we will run Style-Dictionary for each theme
    // and inject the required variables into the JSON config
    if (
      configAsString.includes("%theme%") ||
      config.source === "%themeTokenSets%"
    ) {
      try {
        const themes = JSON.parse(await promises.readFile("$themes.json"));
        this.themes = {};
        themes.forEach((theme) => {
          this.themes[theme.name] = Object.keys(theme.selectedTokenSets);
        });
      } catch (e) {
        throw new Error(
          "Missing or invalid $themes.json in the root of the tokens folder. Try uploading a ZIP that contains this $themes.json file."
        );
      }
    } else {
      this.themes = {};
      this.themedConfigs = [];
    }
    return config;
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
        const cfgAsString = await promises.readFile(configPath, "utf-8");
        cfgObj = JSON.parse(cfgAsString);
      }

      // TODO: uncomment once this bug is fixed where parsers is
      // synced back into the json config but not functioning.
      // Custom parser for JS token files
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

      this.config = await this.processConfig(cfgObj);
      const themeEntries = Object.entries(this.themes);
      if (themeEntries.length > 0) {
        this.sd = await Promise.all(
          themeEntries.map(
            ([theme, tokensets]) =>
              new Promise(async (resolve) => {
                const themedCfg = this.injectThemeVariables(
                  cfgObj,
                  theme,
                  tokensets
                );
                this.themedConfigs.push(themedCfg);
                const sd = await StyleDictionary.extend(themedCfg);
                await sd.buildAllPlatforms();
                resolve(sd);
              })
          )
        );
      } else {
        const sd = await StyleDictionary.extend(cfgObj);
        this.sd = [sd];
        await this.sd[0].buildAllPlatforms();
      }
    } catch (e) {
      console.error(`Style Dictionary error: ${e.stack}`);
    } finally {
      await repopulateFileTree();
      return this.sd;
    }
  }

  injectThemeVariables(cfg, theme, tokensets) {
    const newCfg = JSON.parse(JSON.stringify(cfg).replace(/%theme%/g, theme));
    newCfg.source = tokensets.map((set) => `${set}.json`);
    return newCfg;
  }

  async cleanPlatformOutputDirs() {
    if (this.sd.length < 1) {
      return;
    }

    await Promise.all(
      this.sd.map(
        (sd) =>
          new Promise(async (resolve) => {
            const foldersToClean = new Set();
            Object.entries(sd.platforms).map(([, val]) => {
              if (val.buildPath) {
                foldersToClean.add(val.buildPath.split("/")[0]);
              }
            });

            await Promise.all(
              Array.from(foldersToClean).map((folder) => {
                return new Promise((_resolve) => {
                  fs.rmdir(folder, { recursive: true }, () => {
                    _resolve();
                  });
                });
              })
            );
            resolve();
          })
      )
    );
  }
}

export const sdState = new SdState();
