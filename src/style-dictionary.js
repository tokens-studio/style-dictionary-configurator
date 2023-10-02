import fs from "@bundled-es-modules/memfs";
import StyleDictionary from "style-dictionary";
import {
  repopulateFileTree,
  fileTreeEl,
  currentFileOutput,
} from "./file-tree/file-tree-utils.js";
import {
  expandComposites,
  permutateThemes,
} from "@tokens-studio/sd-transforms";
import { bundle } from "./utils/rollup-bundle.js";
import { findUsedConfigPath } from "./utils/findUsedConfigPath.js";
import { THEME_STRING, SD_FUNCTIONS_PATH } from "./constants.js";
import { snackbar } from "./components/snackbar/SnackbarManager.js";
import { html } from "lit";

const { promises } = fs;

StyleDictionary.registerParser({
  // matches js, mjs
  pattern: /\.(j|mj)s$/,
  parse: async ({ filePath }) => {
    const bundled = await bundle(filePath);
    const url = URL.createObjectURL(
      new Blob([bundled], { type: "text/javascript" })
    );
    const { default: token } = await import(url);
    return expandComposites(token);
  },
});

/**
 * Small State object for getting/setting the current style-dictionary object.
 * Also allows subscribing to changes or awaiting initial setting of the object.
 */
class SdState extends EventTarget {
  constructor() {
    super();
    this._sd = [];
    this._themes = {};
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
    if (v) {
      this.hasInitializedConfigResolve();
      this.dispatchEvent(new CustomEvent("config-changed", { detail: v }));
      this.warnIfTransformGroupWithTransforms();
    }
  }

  get sd() {
    return this._sd;
  }

  set sd(v) {
    this._sd = v;
    this.hasInitializedResolve();
    this.dispatchEvent(new CustomEvent("sd-changed", { detail: v }));
  }

  get themes() {
    return this._themes;
  }

  set themes(v) {
    const oldThemes = structuredClone(this._themes);
    this._themes = v;
    if (JSON.stringify(v) !== JSON.stringify(oldThemes)) {
      this.dispatchEvent(new CustomEvent("themes-changed", { detail: v }));
    }
  }

  warnIfTransformGroupWithTransforms() {
    let shouldWarn = false;
    if (this.config.platforms) {
      for (const [, platform] of Object.entries(this.config.platforms)) {
        if (platform.transformGroup && platform.transforms) {
          shouldWarn = true;
        }
      }
    }
    if (shouldWarn) {
      snackbar.show(
        html`
          <p>Transforms and transformGroup should not be combined.</p>
          <p>
            See
            <a href="https://github.com/amzn/style-dictionary/issues/813"
              >https://github.com/amzn/style-dictionary/issues/813</a
            >
          </p>
        `
      );
    }
  }

  getThemes(themesObj) {
    let themes = permutateThemes(themesObj, { separator: "-" });

    // if single-dimensional theming, we still have to map it accordingly
    // TODO: handle in next breaking version of sd-transforms, to give back the same format
    if (themesObj.every((theme) => !theme.group)) {
      themes = Object.fromEntries(
        themes.map((theme) => [
          theme.name,
          Object.keys(theme.selectedTokenSets),
        ])
      );
    }

    return themes;
  }

  async processConfigForThemes(cfg) {
    const addThemeToFilePath = (file) => {
      const fileParts = file.split(".");
      const index = fileParts.length - 2;
      if (index >= 0 && !file.match(THEME_STRING)) {
        fileParts[index] = `${fileParts[index]}-${THEME_STRING}`;
      }
      return fileParts.join(".");
    };

    try {
      const $themes = JSON.parse(await promises.readFile("$themes.json"));
      // 1) adjust config source and platform files names to themed
      cfg = {
        ...cfg,
        platforms: Object.fromEntries(
          Object.entries(cfg.platforms).map(([key, plat]) => [
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
      delete cfg.source;
      this.themes = this.getThemes($themes);
    } catch (e) {
      this.themes = {};
    }

    return cfg;
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

    return this.processConfigForThemes(cfgObj);
  }

  async loadSDFunctions() {
    if (fs.existsSync(SD_FUNCTIONS_PATH)) {
      const bundled = await bundle(`./${SD_FUNCTIONS_PATH}`);
      const url = URL.createObjectURL(
        new Blob([bundled], { type: "text/javascript" })
      );
      await import(url);
    }
  }

  async runStyleDictionary(force = false) {
    const cfg = await this.loadAndProcessConfig();
    await this.loadSDFunctions();
    if (JSON.stringify(this.config) !== JSON.stringify(cfg) || force) {
      this.config = cfg;
      await this._prepareRunStyleDictionary();
    }
  }

  async _prepareRunStyleDictionary() {
    console.log("Running style-dictionary...");
    document.querySelector("#output-file-tree").animateCue();
    await this.cleanPlatformOutputDirs();
    try {
      const themeEntries = Object.entries(this.themes);
      if (themeEntries.length > 0) {
        const tokenPlatforms = document.querySelector("token-platforms");
        await tokenPlatforms.updateComplete;
        const themesSegmentedControl = tokenPlatforms.shadowRoot.querySelector(
          "ts-segmented-control"
        );
        const selectedThemes = themesSegmentedControl.modelValue;
        this.themedConfigs = themeEntries
          .filter(([theme]) => selectedThemes.includes(theme))
          .map(([theme, tokensets]) =>
            this.injectThemeVariables(this.config, theme, tokensets)
          );

        this._runStyleDictionary(this.themedConfigs);
      } else {
        this._runStyleDictionary([this.config]);
      }
    } catch (e) {
      console.error(`Style Dictionary error: ${e.stack}`);
      snackbar.show(
        `Config error: ${e.message}.\nSee console logs for more info.`
      );
    } finally {
      await repopulateFileTree();
      // refresh currently selected output file
      fileTreeEl.switchToFile(currentFileOutput);
      return this.sd;
    }
  }

  async _runStyleDictionary(cfgs) {
    this.sd = await Promise.all(
      cfgs.map(
        (cfg) =>
          new Promise(async (resolve) => {
            let sd;
            try {
              sd = await StyleDictionary.extend(cfg);
              try {
                await sd.buildAllPlatforms();
              } catch (e) {
                console.error(e);
                snackbar.show(
                  `Build error: ${e.message}.\nSee console logs for more info.`
                );
              }
            } catch (e) {
              console.error(e);
              snackbar.show(
                `Parse error: ${e.message}.\nSee console logs for more info.`
              );
            }

            resolve(sd);
          })
      )
    );
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
            if (sd && sd.platforms) {
              Object.entries(sd.platforms).map(([, val]) => {
                if (val.buildPath) {
                  foldersToClean.add(val.buildPath.split("/")[0]);
                }
              });
            }

            await Promise.all(
              Array.from(foldersToClean).map((folder) => {
                return new Promise((_resolve) => {
                  fs.rmdir("build", { recursive: true }, () => {
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
