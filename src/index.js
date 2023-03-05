import { loadDefaultFeedbackMessages } from "@lion/ui/validate-messages.js";

import {
  createInputFiles,
  setupEditorChangeHandlers,
  dispatchTokens,
  dispatchInputFiles,
  dispatchDictionary,
  dispatchEnrichedTokens,
  openAllFolders,
  switchToFile,
  fileTreeEl,
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
import { setupUploadBtnHandler } from "./file-upload.js";
// side effect: loads file-tree CE definition
import "./file-tree/FileTree.js";
import "./components/platforms/token-platforms.js";
import "./components/button/ts-button.js";
import "@tokens-studio/tokens/dist/css/dark.css";
import "@tokens-studio/tokens/dist/css/core.css";

loadDefaultFeedbackMessages();

export async function changeLang(lang, ed) {
  await ensureMonacoIsLoaded();
  const _editor = ed || editorOutput;

  monaco.editor.setModelLanguage(_editor.getModel(), lang);
}

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
  await createInputFiles(true);
  await sdState.runStyleDictionary();
  await openAllFolders();
  if (fileTreeEl.outputFiles.length > 0) {
    await fileTreeEl.switchToFile(fileTreeEl.outputFiles[0]);
  }
  await switchToFile(findUsedConfigPath(), editorConfig);
  await setupEditorChangeHandlers();
  resizeMonacoLayout();
})();
