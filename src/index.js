import fs from "fs";
import { loadDefaultFeedbackMessages } from "@lion/ui/validate-messages.js";
// import prettier from "prettier";
// import babel from "@babel/parser";
import {
  createInputFiles,
  setupConfigChangeHandler,
  dispatchTokens,
  dispatchInputFiles,
  dispatchDictionary,
  dispatchEnrichedTokens,
  openAllFolders,
  switchToFile,
  fileTreeEl,
  replaceSource,
} from "./file-tree/file-tree-utils.js";
import { sdState } from "./style-dictionary.js";
// side effect: loads the monaco editor
import {
  ensureMonacoIsLoaded,
  editorOutput,
  editorConfig,
  monaco,
} from "./monaco/monaco.js";
import { findUsedConfigPath } from "./utils/findUsedConfigPath.js";
import { resizeMonacoLayout } from "./monaco/resize-monaco-layout.js";
// side effect: loads file-tree CE definition
import "./file-tree/FileTree.js";
import "./components/platforms/token-platforms.js";
import "./components/button/ts-button.js";
import "@tokens-studio/tokens/dist/css/dark.css";
import "@tokens-studio/tokens/dist/css/core.css";
import { BlobReader, TextWriter, ZipReader } from "@zip.js/zip.js";

loadDefaultFeedbackMessages();

export async function changeLang(lang, ed) {
  await ensureMonacoIsLoaded();
  const _editor = ed || editorOutput;

  monaco.editor.setModelLanguage(_editor.getModel(), lang);
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

export async function encodeContents(files) {
  const contents = await getContents(files);
  const content = JSON.stringify(contents);
  return flate.deflate_encode(content);
}

function setupUploadBtnHandler() {
  const btn = document.getElementById("upload-tokens-btn");
  const fileInput = document.getElementById("upload-tokens-input");
  btn.addEventListener("click", () => {
    fileInput.dispatchEvent(new MouseEvent("click"));
  });
  fileInput.addEventListener("change", async (ev) => {
    const blob = ev.target.files[0];
    const zipReader = new ZipReader(new BlobReader(blob));
    const entries = await zipReader.getEntries({ filenameEncoding: "utf-8" });
    const files = Object.fromEntries(
      await Promise.all(
        entries.map((entry) => {
          return new Promise(async (resolve) => {
            const fileContents = await entry.getData(new TextWriter("utf-8"));
            resolve([entry.filename, fileContents]);
          });
        })
      )
    );
    ev.target.value = "";
    replaceSource(files);
  });
}

// async function switchToJS(ev) {
//   const configPath = findUsedConfigPath();
//   if (configPath.endsWith(".json")) {
//     ev.target.parentElement.style.display = "none";
//     const contents = fs.readFileSync(configPath, "utf-8");
//     const newPath = `${configPath.split(".json")[0]}.js`;
//     const newContents = prettier.format(`export default ${contents};`, {
//       // explicitly use babel parser, just parser: "babel" will not work,
//       // rollup won't be smart enough to understand to put babel parser in
//       // final bundle like that because prettier will try to find and use it
//       // under the hood (using its own resolution logic??)
//       parser: (text) => babel.parse(text, { sourceType: "module" }),
//     });
//     fs.unlinkSync(configPath);
//     fs.writeFileSync(newPath, newContents, "utf-8");
//     await rerunStyleDictionary(newPath);
//     await document.querySelector("file-tree").switchToFile(newPath);
//   }
// }

// function switchClose(ev) {
//   ev.target.parentElement.style.display = "none";
//   ev.target.parentElement.setAttribute("closed-by-user", "");
// }

(async function () {
  window.addEventListener("message", (ev) => {
    const { data } = ev;
    switch (data.type) {
      case "sd-tokens-request":
        dispatchTokens(ev);
        break;
      case "sd-input-files-request":
        dispatchInputFiles(ev);
        break;
      case "sd-dictionary-request":
        dispatchDictionary(ev);
        break;
      case "sd-enriched-tokens-request":
        dispatchEnrichedTokens(ev);
        break;
    }
  });

  setupUploadBtnHandler();

  window.addEventListener("resize", async () => {
    await ensureMonacoIsLoaded();
    resizeMonacoLayout();
  });

  await ensureMonacoIsLoaded();
  // true means use Tokens Studio tokens.json instead of a more basic sd-compatible set of tokens
  await createInputFiles();
  await sdState.runStyleDictionary();
  await openAllFolders();
  await fileTreeEl.switchToFile(fileTreeEl.outputFiles[0]);
  await switchToFile(findUsedConfigPath(), editorConfig);
  await setupConfigChangeHandler();
  resizeMonacoLayout();
})();
