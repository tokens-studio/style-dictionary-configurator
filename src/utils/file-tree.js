import { fs } from "style-dictionary/fs";
import { posix as path } from "path-unified";
import { glob } from "@bundled-es-modules/glob";
import { isPlainObject } from "is-plain-object";
import * as zip from "@zip.js/zip.js";
import { sdState } from "../style-dictionary.js";
import { findUsedConfigPath } from "./findUsedConfigPath.js";
import {
  ensureMonacoIsLoaded,
  editorOutput,
  editorConfig,
  resizeMonacoLayout,
  changeLang,
} from "../monaco/monaco.js";
import {
  CONFIG,
  FUNCTIONS,
  FUNCTIONS_SAVED_EVENT,
  CONFIG_SAVED_EVENT,
  INPUT_FILES_CREATED_EVENT,
  SD_FUNCTIONS_PATH,
  TOKENS_SAVED_EVENT,
  SD_CONFIG_PATH,
} from "../constants.js";
import { snackbar } from "../components/snackbar/SnackbarManager.js";

const extensionMap = {
  js: "javascript",
};

const { promises } = fs;

export let currentFileConfig = findUsedConfigPath();
export let currentFileOutput;

export async function getFileTreeEl() {
  const configuratorAppEl = document.querySelector("configurator-element");
  if (!configuratorAppEl) {
    return null;
  }
  await configuratorAppEl.updateComplete;
  return configuratorAppEl.shadowRoot.getElementById("output-file-tree");
}

async function configContentHasChanged() {
  // TODO: Unsaved marker
}

async function getSelectedFileBtn() {
  const fileTreeEl = await getFileTreeEl();
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
    await Promise.all([createConfig(), createStudioTokens()]);
    return;
  }

  const parsedContents = JSON.parse(flate.deflate_decode(project));
  await Promise.all(
    Object.entries(parsedContents).map(([file, content]) => {
      const dir = path.dirname(file);
      if (!fs.existsSync(dir)) {
        return fs.promises
          .mkdir(dir, { recursive: true })
          .then(() => fs.promises.writeFile(file, content));
      }
      return fs.promises.writeFile(file, content);
    })
  );
  await sdState.determineRootFolder();
}

export async function createStudioTokens() {
  const tokens = await (
    await fetch(new URL("./core.json", import.meta.url).href)
  ).json();

  fs.promises.writeFile("studio.json", JSON.stringify(tokens, null, 2));
}

export async function createConfig() {
  fs.promises.writeFile(
    // take the .js by default
    SD_CONFIG_PATH,
    JSON.stringify(
      {
        source: ["**/*.json"],
        preprocessors: ["tokens-studio"],
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
    ),
    "utf-8"
  );
}

export async function replaceSource(files, { clear = true, run = true } = {}) {
  if (clear) {
    await clearAll(clear === "all");
  }
  await Promise.all(
    Object.entries(files).map(
      ([file, content]) =>
        new Promise((resolve) => {
          const dir = path.dirname(file);
          if (!fs.existsSync(dir)) {
            fs.promises.mkdir(dir, { recursive: true }).then(() => {
              fs.writeFile(file, content, resolve);
            });
          }
          fs.writeFile(file, content, resolve);
        })
    )
  );

  window.dispatchEvent(new Event(INPUT_FILES_CREATED_EVENT));
  await encodeContentsToURL();
  const fileTreeEl = await getFileTreeEl();
  if (fileTreeEl.outputFiles.length > 0) {
    await fileTreeEl.switchToFile(fileTreeEl.outputFiles[0]);
  }
  await switchToFile(findUsedConfigPath(), editorConfig);
  resizeMonacoLayout();
  if (run) {
    // reset rootDir
    await sdState.determineRootFolder();
    await sdState.runStyleDictionary({ force: true });
  }
  await openAllFolders();
}

export async function createInputFiles() {
  const urlSplit = window.location.href.split("#project=");
  if (urlSplit.length > 1 && window.__configurator_standalone__) {
    await createFilesFromURL(urlSplit[1]);
  } else {
    await Promise.all([createConfig(), createStudioTokens()]);
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
  await sdState.determineRootFolder();
}

export async function editFileName(filePath, newName, isFolder = false) {
  const newPath = path.join(path.dirname(filePath), newName);
  fs.renameSync(filePath, newPath);
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
  const fileTreeEl = await getFileTreeEl();
  await fileTreeEl.updateComplete;
  Array.from(fileTreeEl.shadowRoot.querySelectorAll("details")).forEach(
    (el) => {
      el.setAttribute("open", "");
    }
  );
}

export async function clearAll(all = false) {
  let files = glob
    .sync("**/*", { fs, mark: true })
    .map((file) => file.slice(1));
  // Keep config, only remove source tokens and output files
  if (!all) {
    files = files.filter(
      (file) => file !== SD_CONFIG_PATH && file !== SD_FUNCTIONS_PATH
    );
  }

  await Promise.all(
    files.map((file) => {
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
  await ensureMonacoIsLoaded();
  editorOutput.setValue("");
  if (all) {
    editorConfig.setValue("");
  }

  if (!all) {
    await repopulateFileTree();
  }
}

export async function saveFile(ed, { noRun = false } = {}) {
  const configuratorAppEl = document.querySelector("configurator-element");
  await configuratorAppEl.updateComplete;
  const configSwitcherEl =
    configuratorAppEl.shadowRoot.getElementById("config-switcher");
  // TODO: unsaved marker -> remove it
  // selectedFileBtn.removeAttribute("unsaved");
  await ensureMonacoIsLoaded();
  const fileTreeEl = await getFileTreeEl();
  if (ed === editorConfig) {
    const configVal = editorConfig.getValue();
    if (configSwitcherEl.checkedChoice === FUNCTIONS) {
      await promises.writeFile(SD_FUNCTIONS_PATH, configVal);
      window.dispatchEvent(
        new CustomEvent(FUNCTIONS_SAVED_EVENT, { detail: configVal })
      );
    } else {
      await promises.writeFile(findUsedConfigPath(), configVal);
      window.dispatchEvent(
        new CustomEvent(CONFIG_SAVED_EVENT, { detail: configVal })
      );
    }
  } else if (fileTreeEl.checkedFile) {
    const outputVal = editorOutput.getValue();
    await promises.writeFile(fileTreeEl.checkedFile, outputVal);
    window.dispatchEvent(
      new CustomEvent(TOKENS_SAVED_EVENT, { detail: outputVal })
    );
  }

  await encodeContentsToURL();
  if (!noRun) {
    await sdState.runStyleDictionary({ force: true });
  }
}

export async function switchToFile(file, ed) {
  const _editor = ed || editorOutput;

  try {
    const ext = path.extname(file).slice(1);
    const lang = extensionMap[ext] || ext;
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
    const fileTreeEl = await getFileTreeEl();
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
      .querySelector("configurator-element")
      .shadowRoot.getElementById("config-switcher")
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
  const fileTreeEl = await getFileTreeEl();
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

  function flattenProperties(properties, result) {
    result = result || [];

    for (var name in properties) {
      if (isPlainObject(properties[name]) && properties.hasOwnProperty(name)) {
        // TODO: handle $value as well
        if ("value" in properties[name]) {
          result.push(properties[name]);
        } else {
          flattenProperties(properties[name], result);
        }
      }
    }

    return result;
  }

  const dictionaries = sdState.sd.map((_sd) => {
    const enrichedTokens = _sd.exportPlatform(platform);
    return {
      allTokens: flattenProperties(enrichedTokens),
      tokens: enrichedTokens,
    };
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
  if (!window.__configurator_standalone__) {
    return;
  }
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

// output files by default, but can pass your own files object
export async function downloadZIP(files) {
  const zipWriter = new zip.ZipWriter(new zip.BlobWriter("application/zip"));

  let outputContents = files;
  // Add all files to zip
  if (!files) {
    const outputFiles = await getOutputFiles();
    outputContents = await getContents(outputFiles);
  }

  await Promise.all(
    Object.entries(outputContents).map(([key, value]) =>
      zipWriter.add(key, new zip.TextReader(value))
    )
  );

  // Close zip and make into URL
  const dataURI = await zipWriter.close();
  const url = URL.createObjectURL(dataURI);

  // Auto-download the ZIP through anchor
  const anchor = document.createElement("a");
  anchor.href = url;
  const today = new Date();
  anchor.download = `sd-output_${today.getFullYear()}-${today.getMonth()}-${(
    "0" + today.getDate()
  ).slice(-2)}.zip`;
  anchor.click();
  URL.revokeObjectURL(url);
}
