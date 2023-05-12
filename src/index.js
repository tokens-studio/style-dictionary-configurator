import { loadDefaultFeedbackMessages } from "@lion/ui/validate-messages.js";
import { fs } from "fs";

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
import { FUNCTIONS, SD_FUNCTIONS_PATH } from "./constants.js";
// side effect: loads file-tree CE definition
import "./file-tree/FileTree.js";
import "./components/platforms/token-platforms.js";
import "./components/button/ts-button.js";
import "./components/config-switcher/config-switcher.js";
import "@tokens-studio/tokens/dist/css/dark.css";
import "@tokens-studio/tokens/dist/css/core.css";

loadDefaultFeedbackMessages();

export async function changeLang(lang, ed) {
  await ensureMonacoIsLoaded();
  const _editor = ed || editorOutput;

  monaco.editor.setModelLanguage(_editor.getModel(), lang);
}

function setupConfigSwitcher() {
  const configSwitcherEl = document.getElementById("config-switcher");
  if (!fs.existsSync(SD_FUNCTIONS_PATH)) {
    fs.writeFileSync(
      SD_FUNCTIONS_PATH,
      `import StyleDictionary from 'style-dictionary';
import { registerTransforms } from '@tokens-studio/sd-transforms';

// sd-transforms, 2nd parameter for options can be added
// See docs: https://github.com/tokens-studio/sd-transforms
registerTransforms(StyleDictionary);

// example value transform, which just returns the token as is
StyleDictionary.registerTransform({
  type: "value",
  name: "myCustomTransform",
  matcher: (token) => {},
  transformer: (token) => {
    return token; // <-- transform as needed
  }
})

// format helpers from style-dictionary
const { fileHeader, formattedVariables } = StyleDictionary.formatHelpers;

// example css format
StyleDictionary.registerFormat({
  name: 'myCustomFormat',
  formatter: function({dictionary, file, options}) {
    const { outputReferences } = options;
    return \`\${fileHeader({file})}:root {
\${formattedVariables({format: 'css', dictionary, outputReferences})}
}\`;
  }
});\n`
    );
  }
  configSwitcherEl.addEventListener("checked-changed", async (ev) => {
    const val = ev.target.checkedChoice;
    if (val === FUNCTIONS) {
      // switch to register sd transforms
      switchToFile(SD_FUNCTIONS_PATH, editorConfig);
    } else {
      // switch to config
      switchToFile(findUsedConfigPath(), editorConfig);
    }
  });
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

  window.addEventListener("resize", async () => {
    await ensureMonacoIsLoaded();
    resizeMonacoLayout();
  });

  await createInputFiles();
  setupConfigSwitcher();
  window.dispatchEvent(new Event("input-files-created"));

  await ensureMonacoIsLoaded();
  setupUploadBtnHandler();
  await setupEditorChangeHandlers();

  await sdState.loadSDFunctions();
  await sdState.runStyleDictionary();

  await openAllFolders();
  if (fileTreeEl.outputFiles.length > 0) {
    await fileTreeEl.switchToFile(fileTreeEl.outputFiles[0]);
  }
  await switchToFile(findUsedConfigPath(), editorConfig);

  resizeMonacoLayout();
})();
