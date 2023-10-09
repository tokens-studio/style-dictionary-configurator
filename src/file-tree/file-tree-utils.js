import createDictionary from "style-dictionary/create-dictionary";
import fs from "@bundled-es-modules/memfs";
import path from "@bundled-es-modules/path-browserify";
import glob from "@bundled-es-modules/glob";
import { changeLang } from "../index.js";
import { sdState } from "../style-dictionary.js";
import mkdirRecursive from "./mkdirRecursive.js";
import {
  ensureMonacoIsLoaded,
  editorOutput,
  editorConfig,
} from "../monaco/monaco.js";
import { findUsedConfigPath } from "../utils/findUsedConfigPath.js";
import { resizeMonacoLayout } from "../monaco/resize-monaco-layout.js";
import {
  CONFIG,
  FUNCTIONS,
  SD_CONFIG_PATH,
  SD_FUNCTIONS_PATH,
} from "../constants";
import { snackbar } from "../components/snackbar/SnackbarManager";

const extensionMap = {
  js: "javascript",
};

const { promises } = fs;

export const fileTreeEl = document.querySelector("#output-file-tree");
export let currentFileConfig = findUsedConfigPath();
export let currentFileOutput;

async function configContentHasChanged() {
  // TODO: Unsaved marker
}

function getSelectedFileBtn() {
  return fileTreeEl.checkedFileBtn;
}

async function createFilesFromURL(project) {
  // Wait for wasm-flate to bootstrap itself
  // After 1 second if not defined, reject and initialize with default
  // tokens studio template
  try {
    await new Promise((resolve, reject) => {
      setInterval(() => {
        if (window.hasOwnProperty("flate")) {
          resolve();
        }
      }, 10);
      setTimeout(reject, 1000);
    });
  } catch (e) {
    snackbar.show(
      "Flate could not be loaded to decode the URL to project files.\nCreating default tokens studio template instead."
    );
    createConfig();
    createStudioTokens();
    return;
  }

  const parsedContents = JSON.parse(flate.deflate_decode(project));
  await Promise.all(
    Object.entries(parsedContents).map(async ([file, content]) => {
      return new Promise(async (resolve) => {
        const dir = path.dirname(file);
        if (dir !== "/") {
          await mkdirRecursive(dir);
        }
        fs.writeFile(file, content, (err) => {
          resolve();
        });
      });
    })
  );
}

export async function createStudioTokens() {
  const tokens = await (
    await fetch(new URL("./core.json", import.meta.url).href)
  ).json();

  fs.writeFileSync("studio.json", JSON.stringify(tokens, null, 2));
}

export function createStandardTokens() {
  fs.mkdirSync(`color`);
  fs.mkdirSync(`card`);
  fs.mkdirSync(`radii`);
  fs.writeFileSync(
    path.join(`color`, "base.json"),
    JSON.stringify(
      {
        color: {
          base: {
            gray: {
              light: { value: "#CCCCCC" },
              medium: { value: "#999999" },
              dark: { value: "#111111" },
            },
            red: { value: "#FF0000" },
            green: { value: "#00FF00" },
          },
        },
      },
      null,
      2
    )
  );

  fs.writeFileSync(
    path.join(`color`, "font.json"),
    JSON.stringify(
      {
        color: {
          font: {
            base: { value: "{color.base.red}" },
            secondary: { value: "{color.base.green}" },
            tertiary: { value: "{color.base.gray.dark}" },
          },
        },
      },
      null,
      2
    )
  );

  fs.writeFileSync(
    path.join(`card`, "card.json"),
    JSON.stringify(
      {
        card: {
          border: {
            radius: {
              mobile: {
                value: "{radii.none}",
              },
              desktop: {
                value: "{radii.sm}",
              },
            },
          },
          heading: {
            color: {
              value: "{color.font.base}",
            },
          },
          text: {
            color: {
              value: "{color.font.tertiary}",
            },
          },
        },
      },
      null,
      2
    )
  );

  fs.writeFileSync(
    path.join(`radii`, "base.json"),
    JSON.stringify(
      {
        radii: {
          none: {
            value: "0",
          },
          sm: {
            value: "8px",
          },
        },
      },
      null,
      2
    )
  );
}

export function createConfig() {
  fs.writeFileSync(
    // take the .js by default
    SD_CONFIG_PATH,
    JSON.stringify(
      {
        source: ["**/*.json"],
        platforms: {
          css: {
            transformGroup: "tokens-studio",
            prefix: "sd",
            buildPath: "build/css/",
            files: [
              {
                destination: "_variables.css",
                format: "css/variables",
              },
            ],
          },
          js: {
            transformGroup: "tokens-studio",
            buildPath: "build/js/",
            files: [
              {
                destination: "variables.js",
                format: "javascript/es6",
              },
            ],
          },
        },
      },
      null,
      2
    )
  );
}

export async function replaceSource(files) {
  await clearAll();
  await Promise.all(
    Object.entries(files).map(
      ([filename, contents]) =>
        new Promise(async (resolve) => {
          const dir = path.dirname(filename);
          if (dir !== "/") {
            await mkdirRecursive(dir);
          }
          fs.writeFile(filename, contents, "utf-8", () => {
            resolve();
          });
        })
    )
  );
  await encodeContentsToURL();
  await sdState.runStyleDictionary(true);
}

export async function createInputFiles() {
  const urlSplit = window.location.href.split("#project=");
  if (urlSplit.length > 1) {
    await createFilesFromURL(urlSplit[1]);
  } else {
    createConfig();
    createStudioTokens();
  }
}

export async function createFile(filename) {
  await new Promise((resolve) => {
    fs.writeFile(filename, "", () => {
      resolve();
    });
  });
}

export async function createFolder(foldername) {
  await new Promise((resolve) => {
    fs.mkdir(foldername, (err) => {
      resolve();
    });
  });
}

export async function editFileName(filePath, newName, isFolder = false) {
  const newPath = path.join(path.dirname(filePath), newName);
  fs.renameSync(filePath, newPath);
  // await sdState.runStyleDictionary();
}

export async function removeFile(file) {
  if (file.endsWith("/")) {
    await new Promise((resolve) => {
      fs.rmdir(file, { recursive: true }, () => {
        resolve();
      });
    });
  } else {
    await new Promise((resolve) => {
      fs.unlink(file, () => {
        resolve();
      });
    });
  }
  await repopulateFileTree();
}

export async function openAllFolders() {
  await fileTreeEl.updateComplete;
  Array.from(fileTreeEl.shadowRoot.querySelectorAll("details")).forEach(
    (el) => {
      el.setAttribute("open", "");
    }
  );
}

export async function clearAll() {
  const files = glob
    .sync("**/*", { fs, mark: true })
    .map((file) => file.slice(1));
  // Keep config, only remove source tokens and output files
  const filtered = files.filter(
    (file) => file !== SD_CONFIG_PATH && file !== SD_FUNCTIONS_PATH
  );

  await Promise.all(
    filtered.map((file) => {
      return new Promise(async (resolve) => {
        if (file.endsWith("/")) {
          await new Promise((resolve) => {
            fs.rmdir(file, { recursive: true }, () => {
              resolve();
            });
          });
        } else if (!file.match("/")) {
          await new Promise((resolve) => {
            fs.unlink(file, () => {
              resolve();
            });
          });
        }
        resolve();
      });
    })
  );
  editorOutput.setValue("");
  await repopulateFileTree();
}

export async function saveFile(ed, { noRun = false } = {}) {
  const configSwitcherEl = document.getElementById("config-switcher");
  // TODO: unsaved marker -> remove it
  // selectedFileBtn.removeAttribute("unsaved");
  await ensureMonacoIsLoaded();
  if (ed === editorConfig) {
    if (configSwitcherEl.checkedChoice === FUNCTIONS) {
      await promises.writeFile(SD_FUNCTIONS_PATH, editorConfig.getValue());
      window.dispatchEvent(new Event("sd-functions-saved"));
    } else {
      await promises.writeFile(findUsedConfigPath(), editorConfig.getValue());
    }
  } else if (fileTreeEl.checkedFile) {
    await promises.writeFile(fileTreeEl.checkedFile, editorOutput.getValue());
  }

  await encodeContentsToURL();
  if (!noRun) {
    await sdState.runStyleDictionary(true);
  }
}

export async function switchToFile(file, ed) {
  // openOrCloseJSSwitch(file);
  const ext = path.extname(file).slice(1);
  const lang = extensionMap[ext] || ext;
  const _editor = ed || editorOutput;

  try {
    const fileData = await new Promise((resolve, reject) => {
      fs.readFile(file, "utf-8", (err, data) => {
        if (err) {
          reject(err);
        }
        resolve(data);
      });
    });

    _editor.setValue(fileData);
    await changeLang(lang, _editor);
    _editor.setScrollTop(0);
  } catch (err) {
    _editor.setValue("");
    fileTreeEl.uncheckAll();
    return;
  }

  await ensureMonacoIsLoaded();
  if (_editor === editorOutput) {
    currentFileOutput = file;
  } else {
    currentFileConfig = file;

    const configTabGroup = document
      .getElementById("config-switcher")
      .shadowRoot.querySelector("config-tab-group");

    configTabGroup.modelValue =
      file === findUsedConfigPath() ? CONFIG : FUNCTIONS;
  }

  // TODO: find better fix, e.g. an event we can wait for in monaco for set value complete or something..
  await new Promise((resolve) => {
    setTimeout(resolve, 10);
  });
  resizeMonacoLayout();
}

export async function setupEditorChangeHandlers() {
  await ensureMonacoIsLoaded();
  if (editorConfig) {
    editorConfig.onDidChangeModelContent((ev) => {
      if (!ev.isFlush) {
        configContentHasChanged();
      }
    });
    editorConfig._domElement.addEventListener("keydown", (ev) => {
      if (ev.key === "s" && (ev.ctrlKey || ev.metaKey)) {
        ev.preventDefault();
        saveFile(editorConfig);
      }
    });
  }
  if (editorOutput) {
    editorOutput._domElement.addEventListener("keydown", (ev) => {
      if (ev.key === "s" && (ev.ctrlKey || ev.metaKey)) {
        ev.preventDefault();
        saveFile(editorOutput);
      }
    });
  }
}

export async function getAllFiles() {
  const filePaths = glob
    .sync("**/*", { fs, nodir: true })
    .map((file) => file.slice(1));

  const allFiles = {};
  await Promise.all(
    filePaths.map((filePath) => {
      return new Promise(async (resolve) => {
        const content = await new Promise((resolve) => {
          fs.readFile(filePath, "utf-8", (err, data) => {
            resolve(data);
          });
        });
        allFiles[filePath] = content;
        resolve();
      });
    })
  );
  return allFiles;
}

export async function getInputFiles() {
  await sdState.hasInitialized;
  const allFiles = glob
    .sync("**/*", { nodir: true, fs })
    .map((file) => file.slice(1));

  const outputFiles = await getOutputFiles();
  return allFiles.filter((file) => !outputFiles.includes(file));
}

export async function getOutputFiles() {
  // without a correct SD instance, we can't really know for sure what the output files are
  // therefore, we can't know what the input files are (tokens + other used files via relative imports)
  await sdState.hasInitialized;
  let platforms;

  // Themes
  if (sdState.themedConfigs.length > 0) {
    platforms = [];
    sdState.themedConfigs.forEach((themedCfg) => {
      Object.entries(themedCfg.platforms).forEach(([key, platform]) => {
        platforms.push([key, platform]);
      });
    });
  } else {
    // No themes
    platforms = Object.entries(sdState.config.platforms);
  }

  let outputFiles = [];
  await Promise.all(
    platforms.map(([, platform]) => {
      return new Promise(async (resolve) => {
        const outFiles = glob
          .sync(`${platform.buildPath}**`, {
            nodir: true,
            fs,
          })
          .map((file) => file.slice(1));
        outputFiles = [...outputFiles, ...outFiles];
        resolve();
      });
    })
  );
  return outputFiles;
}

export async function repopulateFileTree() {
  if (!sdState.sd) {
    console.error(
      "Trying to repopulate file tree without a valid style-dictionary object to check which files are input vs output."
    );
  }
  const inputFiles = await getInputFiles();
  const outputFiles = await getOutputFiles();
  fileTreeEl.outputFiles = outputFiles;
  fileTreeEl.inputFiles = inputFiles;
}

export async function dispatchTokens(ev) {
  const { source } = ev;
  await sdState.hasInitialized;
  source.postMessage(
    {
      type: "sd-tokens",
      tokens: sdState.sd.map((_sd) => _sd.tokens),
    },
    "*"
  );
}

export function uploadTokens(ev) {
  const { data } = ev;
  const { tokens } = data;
  replaceSource({
    "/studio.json": JSON.stringify(tokens, null, 2),
  });
}

export async function dispatchDictionary(ev) {
  const { source } = ev;
  await sdState.hasInitialized;
  // Dictionary can contain methods, for postMessage cloning as a workaround
  // we therefore have to JSON.stringify it and JSON.parse it to clone which removes functions.
  source.postMessage(
    {
      type: "sd-dictionary",
      dictionaries: sdState.sd.map((_sd) => JSON.parse(JSON.stringify(_sd))),
    },
    "*"
  );
}

export async function dispatchEnrichedTokens(ev) {
  const { source, data } = ev;
  const { platform } = data;
  await sdState.hasInitialized;

  const dictionaries = sdState.sd.map((_sd) => {
    const enrichedTokens = _sd.exportPlatform(platform);
    const { allTokens, tokens } = createDictionary({
      properties: enrichedTokens,
    });
    return { allTokens, tokens };
  });

  source.postMessage({ type: "sd-enriched-tokens", dictionaries }, "*");
}

export async function dispatchInputFiles(ev) {
  const { source } = ev;
  const inputFiles = await getInputFiles();
  const contents = await getContents(inputFiles);
  source.postMessage({ type: "sd-input-files", files: contents }, "*");
}

export async function encodeContentsToURL() {
  const inputFiles = await getInputFiles();
  // If no inputFiles, run was error so can't send something useful to analytics atm or encode contents in url
  if (inputFiles.length > 0) {
    const encoded = await encodeContents(inputFiles);
    if (encoded) {
      window.location.href = `${window.location.origin}/#project=${encoded}`;
    }
  }
}

export async function encodeContents(files) {
  const contents = await getContents(files);
  const content = JSON.stringify(contents);
  try {
    await new Promise((resolve, reject) => {
      setInterval(() => {
        if (window.hasOwnProperty("flate")) {
          resolve();
        }
      }, 10);
      setTimeout(reject, 1000);
    });
  } catch (e) {
    snackbar.show("Flate could not be loaded to encode the files to a URL.");
    return "";
  }
  return flate.deflate_encode(content);
}

export async function getContents(files) {
  const contents = {};
  await Promise.all(
    files.map(async (file) => {
      await new Promise((resolve) => {
        fs.readFile(file, "utf-8", (err, data) => {
          contents[file] = data;
          resolve();
        });
      });
    })
  );
  return contents;
}
