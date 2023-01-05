import fs from "fs";
import StyleDictionary from "browser-style-dictionary/browser.js";
import { Required } from "@lion/ui/form-core.js";
import { editorConfig } from "../../monaco/monaco.js";
import { switchToFile } from "../../file-tree/file-tree-utils.js";
import { findUsedConfigPath } from "../../utils/findUsedConfigPath.js";
import { LitElement, css, html } from "lit";
import { sdState } from "../../style-dictionary.js";
import { TransformsValidator } from "../combobox/TransformsValidator.js";

// Custom Element Definitions
import "../collapsible/sd-collapsible.js";
import "../dialog/sd-dialog.js";
import "../dialog/sd-dialog-frame.js";
import "../input/sd-input.js";
import "../combobox/sd-combobox.js";
import "../combobox/sd-option.js";
import "../combobox/sd-selection-display.js";

class TokenPlatforms extends LitElement {
  static get styles() {
    return css`
      .codicon[class*="codicon-"] {
        font: normal normal normal 16px/1 codicon;
        background-color: transparent;
        border: none;
        cursor: pointer;
      }

      .codicon-edit:before {
        content: "\\ea73";
      }

      .codicon-close:before {
        content: "\\ea76";
      }

      .codicon-diff-added:before {
        content: "\\eadc";
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

      .platform-form > sd-input {
        margin-bottom: 0.5rem;
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
        <sd-dialog>
          <button
            slot="invoker"
            class="codicon codicon-diff-added"
            aria-label="add platform button"
          ></button>
          <sd-dialog-frame has-close-button slot="content">
            <p slot="header">Add a new platform</p>
            <div slot="content">
              <form class="platform-form" @submit="${() => {}}">
                <sd-input
                  name="title"
                  label="Platform name"
                  .validators=${[new Required()]}
                ></sd-input>
                <sd-input
                  name="build-path"
                  label="Build path"
                  help-text="Relative to root, without leading '/'"
                ></sd-input>
                <sd-combobox
                  name="transforms"
                  label="Transforms"
                  help-text="One transform group is allowed, you can pick multiple standalone transforms"
                  show-all-on-empty
                  multiple-choice
                  .validators=${[new TransformsValidator()]}
                >
                  ${Object.keys(StyleDictionary.transformGroup).map(
                    (transformGroup) => html`
                      <sd-option
                        .checked=${false}
                        .choiceValue="${transformGroup} (group)"
                        group
                        >${transformGroup} (group)</sd-option
                      >
                    `
                  )}
                  ${Object.keys(StyleDictionary.transform).map(
                    (transform) => html`
                      <sd-option .checked=${false} .choiceValue="${transform}"
                        >${transform}</sd-option
                      >
                    `
                  )}
                  <sd-selection-display
                    slot="selection-display"
                  ></sd-selection-display>
                </sd-combobox>
              </form>
            </div>
          </sd-dialog-frame>
        </sd-dialog>
      </div>
      <div class="platforms-container">${this.platformsTemplate()}</div>
    `;
  }

  platformsTemplate() {
    if (!this._platforms) {
      return "";
    }

    return html`${this.platformsToEntries().map(
      (plat) => html`
        <div class="platform border">
          <div class="platform__header">
            <p class="platform__title">${plat.key}</p>
            <sd-dialog
              @opened-changed=${(ev) => {
                // Autofocuses the input upon opening the dialog
                if (ev.target.opened) {
                  const inputEl = ev.target.querySelector("sd-input");
                  inputEl.focus();
                }
              }}
            >
              <button
                slot="invoker"
                aria-label="edit platform"
                class="codicon codicon-edit"
              ></button>
              <sd-dialog-frame slot="content">
                <div slot="content">
                  <form
                    data-curr-title="${plat.key}"
                    @submit=${this.applyPlatformName}
                  >
                    <sd-input
                      name="platform-name"
                      label="Change platform name"
                    ></sd-input>
                    <button type="submit">Apply</button>
                    <button
                      @click="${(ev) =>
                        ev.target.dispatchEvent(
                          new Event("close-overlay", { bubbles: true })
                        )}"
                      type="button"
                    >
                      Cancel
                    </button>
                  </form>
                </div>
              </sd-dialog-frame>
            </sd-dialog>
          </div>
          ${this.transformsTemplate(plat)} ${this.formatsTemplate(plat)}
        </div>
      `
    )}`;
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
          <!-- TODO: Add delete button for the transform -->
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
                  <!-- TODO: Add delete button for the format -->
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
}

customElements.define("token-platforms", TokenPlatforms);
