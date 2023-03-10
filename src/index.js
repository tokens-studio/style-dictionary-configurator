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
import { REGISTER_SD_PATH } from "./constants.js";
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
  configSwitcherEl.addEventListener("model-value-changed", async (ev) => {
    if (ev.target.checked) {
      // switch to register sd transforms
      if (!fs.existsSync(REGISTER_SD_PATH)) {
        fs.writeFileSync(
          REGISTER_SD_PATH,
          `import StyleDictionary from 'style-dictionary';

StyleDictionary.registerTransform({
  type: "value",
  name: "myCustomTransform",
  matcher: (token) => {},
  transformer: (token) => {
    return token; // <-- transform as needed
  }
})

const { fileHeader, formattedVariables } = StyleDictionary.formatHelpers;

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
        await sdState.loadSDFunctions();
        await sdState.runStyleDictionary(true);
      }
      switchToFile(REGISTER_SD_PATH, editorConfig);
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
  await ensureMonacoIsLoaded();

  setupUploadBtnHandler();
  await setupEditorChangeHandlers();
  setupConfigSwitcher();

  await createInputFiles({ studioTokens: true });
  await sdState.loadSDFunctions();
  await sdState.runStyleDictionary();

  await openAllFolders();
  if (fileTreeEl.outputFiles.length > 0) {
    await fileTreeEl.switchToFile(fileTreeEl.outputFiles[0]);
  }
  await switchToFile(findUsedConfigPath(), editorConfig);

  resizeMonacoLayout();
})();
