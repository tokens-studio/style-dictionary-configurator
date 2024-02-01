import {
  createInputFiles,
  dispatchTokens,
  uploadTokens,
  dispatchInputFiles,
  dispatchDictionary,
  dispatchEnrichedTokens,
} from "./utils/file-tree.js";
import { setupUploadBtnHandler } from "./file-upload.js";
import { setupEjectBtnHandler } from "./eject.js";
import { INPUT_FILES_CREATED_EVENT } from "./constants.js";
import "./configurator-element.js";

export async function initApp() {
  // set so that file tree utils knows to encode file contents to URL
  window.__configurator_standalone__ = true;
  window.addEventListener("message", (ev) => {
    const { data } = ev;
    switch (data.type) {
      case "sd-tokens-request":
        dispatchTokens(ev);
        break;
      case "sd-tokens-upload":
        uploadTokens(ev);
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
  await createInputFiles();
  window.dispatchEvent(new Event(INPUT_FILES_CREATED_EVENT));
  setupUploadBtnHandler();
  setupEjectBtnHandler();
}
