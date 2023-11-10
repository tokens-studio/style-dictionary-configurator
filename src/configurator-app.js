import { LitElement, html, css } from "lit";
import { loadDefaultFeedbackMessages } from "@lion/ui/validate-messages.js";
import {
  setupEditorChangeHandlers,
  openAllFolders,
  switchToFile,
  getFileTreeEl,
} from "./utils/file-tree.js";
import { findUsedConfigPath } from "./utils/findUsedConfigPath.js";
import { editorConfig, resizeMonacoLayout } from "./monaco/monaco.js";
import { sdState } from "./style-dictionary.js";
import "./components/file-tree/file-tree.js";
import "./components/platforms/token-platforms.js";
import "./components/config-switcher/config-switcher.js";

loadDefaultFeedbackMessages();

class ConfiguratorApp extends LitElement {
  static get styles() {
    return [
      css`
        :host {
          height: 100%;
        }

        .middle {
          min-width: 350px;
          max-width: 550px;
          overflow-y: auto;
          padding: var(--space7);
          padding-top: 0;
          box-sizing: border-box;
        }

        .content {
          display: flex;
          height: calc(100% - 35px);
          padding-top: 35px;
        }

        .right {
          position: relative;
        }

        .monaco-wrapper {
          display: flex;
          height: 50%;
          border-radius: var(--border-radius-editor);
          border-left: 1px solid var(--borderMuted);
          margin: 0 auto;
          position: relative;
        }

        ::slotted(#monaco-container-config) {
          z-index: 1;
          border-bottom: 1px solid var(--fgDefault);
        }

        ::slotted(*)::before {
          position: absolute;
          font-size: 14px;
          top: 0;
          left: 50%;
          transform: translate(-50%, -100%);
          z-index: 1;
        }

        ::slotted(#monaco-container-config)::before {
          content: "config/functions file";
        }

        ::slotted(#monaco-container-output)::before {
          content: "input/output file";
          color: var(--accentOnAccent);
        }
      `,
    ];
  }

  firstUpdated() {
    this.init();
  }

  render() {
    return html`
      <section class="page-title"></section>
      <section class="content">
        <section class="middle">
          <token-platforms></token-platforms>
        </section>
        <section class="right">
          <config-switcher id="config-switcher"></config-switcher>
          <div class="monaco-wrapper config">
            <slot name="monaco-config"></slot>
          </div>
          <div class="monaco-wrapper output">
            <file-tree id="output-file-tree"></file-tree>
            <slot name="monaco-output"></slot>
          </div>
        </section>
      </section>
    `;
  }

  async init() {
    await setupEditorChangeHandlers();
    await sdState.loadSDFunctions();
    await sdState.runStyleDictionary();

    await openAllFolders();
    const fileTreeEl = await getFileTreeEl();
    if (fileTreeEl.outputFiles.length > 0) {
      await fileTreeEl.switchToFile(fileTreeEl.outputFiles[0]);
    }
    await switchToFile(findUsedConfigPath(), editorConfig);

    resizeMonacoLayout();
  }
}

customElements.define("configurator-app", ConfiguratorApp);
