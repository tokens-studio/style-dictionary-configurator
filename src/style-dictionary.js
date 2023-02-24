import fs, { promises } from "fs";
import StyleDictionary from "browser-style-dictionary/browser.js";
import {
  repopulateFileTree,
  fileTreeEl,
  currentFileOutput,
  encodeContentsToURL,
} from "./file-tree/file-tree-utils.js";
import { registerTransforms } from "@tokens-studio/sd-transforms";
import { bundle } from "./utils/rollup-bundle.js";
import { findUsedConfigPath } from "./utils/findUsedConfigPath.js";
import { THEME_SETS, THEME_STRING } from "./constants.js";

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
    encodeContentsToURL();
  }

  get sd() {
    return this._sd;
  }

  set sd(v) {
    this._sd = v;
    this.hasInitializedResolve();
    this.dispatchEvent(new CustomEvent("sd-changed", { detail: v }));
  }

  async processConfigForThemes(_config) {
    let config = _config;
    const configAsString = JSON.stringify(config);

    // Detection of tokens studio using themes
    // This means we will run Style-Dictionary for each theme
    // and inject the required variables into the JSON config
    if (configAsString.includes(THEME_STRING) || config.source === THEME_SETS) {
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

  get JSFileParser() {
    return {
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
    };
  }

  mergeWithJSFileParser(cfg) {
    return {
      ...cfg,
      parsers: [...(cfg.parsers || []), this.JSFileParser],
    };
  }

  async loadAndProcessConfig() {
    let cfgObj;
    const configPath = findUsedConfigPath();
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

    this.config = await this.processConfigForThemes(cfgObj);
  }

  async runStyleDictionary() {
    await this.loadAndProcessConfig();
    await this.themeDetection();
    await this._runStyleDictionary();
  }

  async _runStyleDictionary() {
    console.log("Running style-dictionary...");
    document.querySelector("#output-file-tree").animateCue();
    await this.cleanPlatformOutputDirs();
    try {
      const themeEntries = Object.entries(this.themes);
      if (themeEntries.length > 0) {
        this.sd = await Promise.all(
          themeEntries.map(
            ([theme, tokensets]) =>
              new Promise(async (resolve) => {
                const themedCfg = this.injectThemeVariables(
                  this.config,
                  theme,
                  tokensets
                );
                this.themedConfigs.push(themedCfg);
                const sd = await StyleDictionary.extend(
                  this.mergeWithJSFileParser(themedCfg)
                );
                await sd.buildAllPlatforms();
                resolve(sd);
              })
          )
        );
      } else {
        const sd = await StyleDictionary.extend(
          this.mergeWithJSFileParser(this.config)
        );
        this.sd = [sd];
        await this.sd[0].buildAllPlatforms();
      }
    } catch (e) {
      console.error(`Style Dictionary error: ${e.stack}`);
    } finally {
      await repopulateFileTree();
      // refresh currently selected output file
      fileTreeEl.switchToFile(currentFileOutput);
      return this.sd;
    }
  }

  async themeDetection() {
    const addThemeToFilePath = (file) => {
      const fileParts = file.split(".");
      const index = fileParts.length - 2;
      if (index >= 0 && !file.match(THEME_STRING)) {
        fileParts[index] = `${fileParts[index]}-${THEME_STRING}`;
      }
      return fileParts.join(".");
    };

    const themeSwitch = document.getElementById("theme-switch-main");

    promises
      .readFile("$themes.json")
      .then((themesFile) => {
        const themes = JSON.parse(themesFile);
        if (themes.length > 0) {
          // 1) adjust config source and platform files names to themed
          this.config = {
            ...this.config,
            source: THEME_SETS,
            platforms: Object.fromEntries(
              Object.entries(this.config.platforms).map(([key, plat]) => [
                key,
                {
                  ...plat,
                  files: plat.files.map((file) => ({
                    ...file,
                    destination: addThemeToFilePath(file.destination),
                  })),
                },
              ])
            ),
          };

          if (themeSwitch) {
            themeSwitch.removeAttribute("disabled");
            themeSwitch.checked = true;
          }
        } else {
          if (themeSwitch) {
            themeSwitch.setAttribute("disabled", "");
            themeSwitch.checked = false;
          }
        }
      })
      .catch(() => {});
  }

  injectThemeVariables(cfg, theme, tokensets) {
    const reg = new RegExp(THEME_STRING, "g");
    const newCfg = JSON.parse(JSON.stringify(cfg).replace(reg, theme));
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
