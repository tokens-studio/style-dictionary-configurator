import fs from "fs";
import { LitElement, css, html } from "lit";
import StyleDictionary from "browser-style-dictionary/browser.js";
import { editorConfig } from "../../monaco/monaco.js";
import { switchToFile } from "../../file-tree/file-tree-utils.js";
import { findUsedConfigPath } from "../../utils/findUsedConfigPath.js";
import { sdState } from "../../style-dictionary.js";
import styles from "./token-platform.css.js";

// Custom Element Definitions
import "./platforms-dialog.js";
import "../collapsible/sd-collapsible.js";
import "../input/sd-input.js";
import "../icon-button/icon-button.js";
import "../button/button.js";

class TokenPlatforms extends LitElement {
  static get styles() {
    return styles;
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
      <div class="platforms">
        <h2>Platforms</h2>
        <div class="platforms-container">${this.platformsTemplate()}</div>
        <platforms-dialog
          @save-platform=${this.savePlatform}
        ></platforms-dialog>
      </div>
    `;
  }

  platformsTemplate() {
    if (!this._platforms) {
      return "";
    }

    return html`
      ${this.platformsToEntries().map(
        (plat) => html`
          <div class="platform">
            <div class="platform__header">
              <h3 class="platform__title">${plat.key}</h3>
              <platforms-dialog
                @save-platform=${this.savePlatform}
                platform="${plat.key}"
              ></platforms-dialog>
            </div>
            <div class="platform__content">
              ${this.transformsTemplate(plat)} ${this.formatsTemplate(plat)}
            </div>
          </div>
        `
      )}
    `;
  }

  transformsTemplate(platform) {
    return html`
      <div class="config-group">
        <h3>Transforms</h3>
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
      <div class="transform">
        <h4>${platform.transformGroup}</h4>
        <div class="text-small">
          ${StyleDictionary.transformGroup[platform.transformGroup].join(", ")}
        </div>
      </div>
    `;
  }

  standaloneTransformsTemplate(platform) {
    return html`
      ${platform.transforms.map(
        (transform) => html`
          <div class="transform">
            <h4>${transform}</h4>
            <div class="text-small">
              A description for the transform to help explain it.
            </div>
          </div>
        `
      )}
    `;
  }

  formatsTemplate(platform) {
    return html`
      <div class="config-group">
        <h3>Formats</h3>
        <div class="formats-container">
          ${platform.files
            ? platform.files.map(
                (file) => html`
                  <div class="format">
                    <h4>${file.format}</h4>
                    <div class="format-file">
                      <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M3.5 2.5C3.22386 2.5 3 2.72386 3 3V13C3 13.2761 3.22386 13.5 3.5 13.5H11.5C11.7761 13.5 12 13.2761 12 13V6.5H8.5C8.22386 6.5 8 6.27614 8 6V2.5H3.5ZM9 3.20711L11.2929 5.5H9V3.20711ZM2 3C2 2.17157 2.67157 1.5 3.5 1.5H8.5C8.63261 1.5 8.75979 1.55268 8.85355 1.64645L12.8536 5.64645C12.9473 5.74021 13 5.86739 13 6V13C13 13.8284 12.3284 14.5 11.5 14.5H3.5C2.67157 14.5 2 13.8284 2 13V3Z" fill="currentColor"/>
                      </svg>
                      ${file.destination}
                    </div>
                  </div>
                `
              )
            : ""}
        </div>
      </div>
    `;
  }

  removeTransformGroup(platform) {
    const copy = structuredClone(this._platforms);
    delete this._platforms[platform].transformGroup;
    this.requestUpdate("_platforms", copy);
    const dialogEl = this.shadowRoot.querySelector(`[platform="${platform}"]`);
    dialogEl.onPlatformChanged();
  }

  removeFormat(platform, format) {
    const copy = structuredClone(this._platforms);
    this._platforms[platform].files = this._platforms[platform].files.filter(
      (file) => file.format !== format
    );
    this.requestUpdate("_platforms", copy);
    const dialogEl = this.shadowRoot.querySelector(`[platform="${platform}"]`);
    dialogEl.onPlatformChanged();
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
