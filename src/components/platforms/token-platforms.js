import fs from "fs";
import StyleDictionary from "browser-style-dictionary/browser.js";
import { editorConfig } from "../../monaco/monaco.js";
import { switchToFile } from "../../file-tree/file-tree-utils.js";
import { findUsedConfigPath } from "../../utils/findUsedConfigPath.js";
import { LitElement, css, html } from "lit";
import { sdState } from "../../style-dictionary.js";

// Custom Element Definitions
import "./platforms-dialog.js";
import "../collapsible/sd-collapsible.js";
import "../input/sd-input.js";

class TokenPlatforms extends LitElement {
  static get styles() {
    return css`
      .codicon[class*="codicon-"] {
        font: normal normal normal 16px/1 codicon;
        background-color: transparent;
        border: none;
        cursor: pointer;
      }

      .codicon-close:before {
        content: "\\ea76";
      }

      .platforms-header {
        display: flex;
        gap: 1rem;
        justify-content: center;
        align-items: center;
      }

      h2 {
        text-align: center;
        line-height: 1.1rem;
      }

      p {
        margin: 0;
      }

      .border {
        border: 1px solid black;
        border-radius: 8px;
      }

      .platforms-container {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        margin: 0 2rem;
      }

      .platform {
        padding: 2rem;
      }

      .platform__header {
        display: flex;
        justify-content: space-between;
      }

      .platform__title {
        font-size: 1.25rem;
        font-weight: bold;
      }

      .transforms {
        margin: 1rem 0;
      }

      .transforms,
      .formats {
        padding: 1rem;
      }

      .transform-group-container {
        display: flex;
        align-items: flex-start;
      }

      .transform-group__btn {
        font-size: 1rem;
        position: relative;
        padding: 15px 25px;
        width: 100%;
      }

      .transform-group__btn::before {
        content: "group";
        font-size: 0.75rem;
        position: absolute;
        bottom: 0;
        left: 0;
      }

      .transform-group__btn::after {
        content: "+";
        font-size: 1.75rem;
        position: absolute;
        top: 50%;
        right: 15px;
        display: inline-block;
        transform: translateY(-50%);
      }

      .transform__collapsible {
        flex-grow: 1;
      }

      .transform__collapsible[opened] .transform-group__btn::after {
        content: "-";
      }

      .codicon.codicon-close {
        font-size: 24px;
        margin-top: 0.875rem;
      }

      .formats-container {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .format {
        position: relative;
        padding: 0.75rem;
      }

      .codicon.delete-format {
        position: absolute;
        top: 4px;
        right: 0;
        font-size: 0.75rem;
        margin: 0;
      }
    `;
  }

  static get properties() {
    return {
      _platforms: {
        state: true,
      },
      _config: {
        state: true,
      },
    };
  }

  connectedCallback() {
    super.connectedCallback();
    this.setupSdListeners();
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    if (
      changedProperties.has("_platforms") &&
      changedProperties.get("_platforms") !== undefined &&
      JSON.stringify(this._platforms) !==
        JSON.stringify(changedProperties.get("_platforms"))
    ) {
      this._config.platforms = this._platforms;
      const cfgPath = findUsedConfigPath();
      fs.writeFileSync(cfgPath, JSON.stringify(this._config, null, 2));
      switchToFile(cfgPath, editorConfig);
      sdState.rerunStyleDictionary();
    }
  }

  platformsToEntries() {
    return Object.entries(this._platforms).map(([key, plat]) => ({
      ...plat,
      key,
    }));
  }

  async setupSdListeners() {
    await sdState.hasInitializedConfig;
    this._config = sdState.config;
    sdState.addEventListener("config-changed", (ev) => {
      this._config = ev.detail;
      this._platforms = this._config.platforms;
    });

    await sdState.hasInitialized;
    this._platforms = sdState.sd.platforms;
    sdState.addEventListener("sd-changed", (ev) => {
      this._platforms = ev.detail.platforms;
    });
  }

  render() {
    return html`
      <div class="platforms-header">
        <h2>Platforms</h2>
        <platforms-dialog
          @save-platform=${this.savePlatform}
        ></platforms-dialog>
      </div>
      <div class="platforms-container">${this.platformsTemplate()}</div>
    `;
  }

  platformsTemplate() {
    if (!this._platforms) {
      return "";
    }

    return html`
      ${this.platformsToEntries().map(
        (plat) => html`
          <div class="platform border">
            <div class="platform__header">
              <p class="platform__title">${plat.key}</p>
              <platforms-dialog
                @save-platform=${this.savePlatform}
                .platform=${plat.key}
              ></platforms-dialog>
            </div>
            ${this.transformsTemplate(plat)} ${this.formatsTemplate(plat)}
          </div>
        `
      )}
    `;
  }

  transformsTemplate(platform) {
    return html`
      <div class="border transforms">
        <p>Transforms</p>
        <!-- Transform Groups -->
        ${platform.transformGroup ? this.transformGroupTemplate(platform) : ""}
        <!-- Transforms standalone -->
        ${platform.transforms
          ? this.standaloneTransformsTemplate(platform)
          : ""}
      </div>
    `;
  }

  transformGroupTemplate(platform) {
    return html`
      <div class="transform-group-container">
        <sd-collapsible class="transform__collapsible">
          <button slot="invoker" class="transform-group__btn">
            ${platform.transformGroup}
          </button>
          <ul slot="content">
            ${StyleDictionary.transformGroup[platform.transformGroup].map(
              (transform) => html` <li>${transform}</li> `
            )}
          </ul>
        </sd-collapsible>
        <button
          @click="${() => this.removeTransformGroup(platform.key)}"
          class="codicon codicon-close"
          aria-label="delete this transform group"
        ></button>
      </div>
    `;
  }

  standaloneTransformsTemplate(platform) {
    return html`
      ${platform.transforms.map(
        (transform) => html`
          <div class="transform-container">${transform}</div>
        `
      )}
    `;
  }

  formatsTemplate(platform) {
    return html`
      <div class="border formats">
        <p>Formats</p>
        <div class="formats-container">
          ${platform.files
            ? platform.files.map(
                (file) => html`
                  <div class="format border">
                    <button
                      class="delete-format codicon codicon-close"
                      @click="${() =>
                        this.removeFormat(platform.key, file.format)}"
                    ></button>
                    <p>${file.format}</p>
                    <p>File: ${file.destination}</p>
                  </div>
                `
              )
            : ""}
        </div>
      </div>
    `;
  }

  applyPlatformName(ev) {
    ev.preventDefault();
    const oldName = ev.target.getAttribute("data-curr-title");
    const platformInput = ev.target.elements["platform-name"];
    const newName = platformInput.value;
    ev.target.reset();
    if (oldName !== newName) {
      const copy = structuredClone(this._platforms);
      this._platforms[newName] = this._platforms[oldName];
      delete this._platforms[oldName];
      this.requestUpdate("_platforms", copy);
    }
    ev.target.dispatchEvent(new Event("close-overlay", { bubbles: true }));
  }

  removeTransformGroup(platform) {
    const copy = structuredClone(this._platforms);
    delete this._platforms[platform].transformGroup;
    this.requestUpdate("_platforms", copy);
  }

  removeFormat(platform, format) {
    const copy = structuredClone(this._platforms);
    this._platforms[platform].files = this._platforms[platform].files.filter(
      (file) => file.format !== format
    );
    this.requestUpdate("_platforms", copy);
  }

  savePlatform(ev) {
    const { detail } = ev;

    sdState.config = {
      ...sdState.config,
      platforms: {
        ...sdState.config.platforms,
        ...detail,
      },
    };
  }
}

customElements.define("token-platforms", TokenPlatforms);
