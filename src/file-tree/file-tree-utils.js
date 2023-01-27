import fs, { promises } from "fs";
import util from "util";
import path from "path";
import glob from "glob";
import tokens from "./core.tokens.json";
import { changeLang, getContents } from "../index.js";
import { sdState } from "../style-dictionary.js";
import createDictionary from "browser-style-dictionary/lib/utils/createDictionary.js";
import mkdirRecursive from "./mkdirRecursive.js";
import {
  ensureMonacoIsLoaded,
  editorOutput,
  editorConfig,
} from "../monaco/monaco.js";
import { findUsedConfigPath } from "../utils/findUsedConfigPath.js";
import { resizeMonacoLayout } from "../monaco/resize-monaco-layout.js";

const asyncGlob = util.promisify(glob);
const extensionMap = {
  js: "javascript",
};

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
  // TODO: cycle a loop, every 50ms check if flate has become defined
  // stop after 1 second and throw
  await new Promise((resolve) => setTimeout(resolve, 200));
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
  fs.writeFileSync("studio.tokens.json", JSON.stringify(tokens, null, 2));
}

export function createStandardTokens() {
  fs.mkdirSync(`color`);
  fs.mkdirSync(`card`);
  fs.mkdirSync(`radii`);
  fs.writeFileSync(
    path.join(`color`, "base.tokens.json"),
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
    path.join(`color`, "font.tokens.json"),
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
    path.join(`card`, "card.tokens.json"),
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
    path.join(`radii`, "base.tokens.json"),
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

export function createConfig(studioTokens = false) {
  fs.writeFileSync(
    // take the .js by default
    "config.json",
    JSON.stringify(
      {
        source: ["**/*.tokens.json"],
        platforms: {
          css: {
            transformGroup: studioTokens ? "tokens-studio" : "css",
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
            transformGroup: studioTokens ? "tokens-studio" : "js",
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
          fs.writeFile(filename, contents, "utf-8", () => {
            resolve();
          });
        })
    )
  );
  await sdState.rerunStyleDictionary();
}

export async function createInputFiles(studioTokens = false) {
  const urlSplit = window.location.href.split("#project=");
  if (urlSplit.length > 1) {
    await createFilesFromURL(urlSplit[1]);
  } else {
    createConfig(studioTokens);
    if (studioTokens) {
      createStudioTokens();
    } else {
      createStandardTokens();
    }
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
  await sdState.rerunStyleDictionary(newPath, isFolder);
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
  const files = await asyncGlob("**/*", { fs, mark: true });
  // Keep config, only remove source tokens and output files
  const filtered = files.filter((file) => file !== "config.json");
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

export async function saveConfig() {
  await new Promise(async (resolve) => {
    await ensureMonacoIsLoaded();
    fs.writeFile(findUsedConfigPath(), editorConfig.getValue(), () => {
      resolve();
    });
  });

  // TODO: unsaved marker -> remove it
  // selectedFileBtn.removeAttribute("unsaved");

  await sdState.rerunStyleDictionary();
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
  }

  // TODO: find better fix, e.g. an event we can wait for in monaco for set value complete or something..
  await new Promise((resolve) => {
    setTimeout(resolve, 10);
  });
  resizeMonacoLayout();
}

export async function setupConfigChangeHandler() {
  await ensureMonacoIsLoaded();
  editorConfig.onDidChangeModelContent((ev) => {
    if (!ev.isFlush) {
      configContentHasChanged();
    }
  });
  editorConfig._domElement.addEventListener("keydown", (ev) => {
    if (ev.key === "s" && (ev.ctrlKey || ev.metaKey)) {
      ev.preventDefault();
      saveConfig();
    }
  });
}

export async function getAllFiles() {
  const filePaths = await asyncGlob("**/*", { fs, nodir: true });

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
  const allFiles = await asyncGlob("**/*", { nodir: true, fs });
  const outputFiles = await getOutputFiles();
  return allFiles.filter((file) => !outputFiles.includes(file));
}

export async function getOutputFiles() {
  // without a correct SD instance, we can't really know for sure what the output files are
  // therefore, we can't know what the input files are (tokens + other used files via relative imports)
  await sdState.hasInitialized;
  const { platforms } = sdState.config;
  let outputFiles = [];
  await Promise.all(
    Object.entries(platforms).map(([key, platform]) => {
      return new Promise(async (resolve) => {
        const outFiles = await asyncGlob(`${platform.buildPath}**`, {
          nodir: true,
          fs,
        });
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
