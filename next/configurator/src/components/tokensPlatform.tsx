import React from 'react';
import StyleDictionary from "browser-style-dictionary/browser.js";
import { sdState } from "../../style-dictionary.js";
import {
    encodeContentsToURL,
    switchToFile,
} from "../../file-tree/file-tree-utils.js";

export type Platform = {
    transforms?: string[];
    transformGroup?: string;
}

export class TokenPlatforms extends React.Component {


    static get properties() {
        return {
            _platforms: {
                state: true
            },
            _config: {
                state: true
            },
            _themes: {
                state: true
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
        this.setupSdListeners();
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        if (
            changedProperties.has('_platforms') &&
            changedProperties.get('_platforms') !== undefined &&
            JSON.stringify(this._platforms) !==
            JSON.stringify(changedProperties.get('_platforms'))
        ) {
            this._config.platforms = this._platforms;
            const cfgPath = findUsedConfigPath();
            fs.writeFileSync(cfgPath, JSON.stringify(this._config, null, 2));
            encodeContentsToURL();
            switchToFile(cfgPath, editorConfig);
            sdState.runStyleDictionary();
        }
    }

    platformsToEntries() {
        return Object.entries(this._platforms).map(([key, plat]) => ({
            ...plat,
            key
        }));
    }

    async setupSdListeners() {
        await sdState.hasInitializedConfig;
        this._config = sdState.config;
        this._platforms = sdState.config.platforms;
        this._themes = Object.keys(sdState.themes);
        sdState.addEventListener('config-changed', (ev) => {
            this._config = ev.detail;
            this._platforms = this._config.platforms;
            Array.from(this.shadowRoot.querySelectorAll('platforms-dialog')).forEach(
                (el) => {
                    el.onPlatformChanged();
                }
            );
        });
        sdState.addEventListener('themes-changed', (ev) => {
            this._themes = Object.keys(ev.detail);
            Array.from(this.shadowRoot.querySelectorAll('platforms-dialog')).forEach(
                (el) => {
                    el.onPlatformChanged();
                }
            );
        });
    }

    render() {
        return <div className="platforms">
            <div className="settings">
                {this._the}

                ${this._themes && this._themes.length > 0
                    ? html`
                  <ts-segmented-control name="themes" label="Themes">
                    ${this._themes.map(
                        (theme) => html`
                        <ts-segmented-choice
                          checked
                          label="${theme}"
                          .choiceValue=${theme}
                        ></ts-segmented-choice>
                      `
                    )}
                  </ts-segmented-control>
                `
                    : html`<div className="flex-spacer"></div>`}
                <settings-dialog></settings-dialog>
            </div>
            <h2>Platforms</h2>
            <div className="platforms-container">${this.platformsTemplate()}</div>
            <platforms-dialog
            @save-platform=${this.savePlatform}
          ></platforms-dialog>
        </div >
      ;
    }

    platformsTemplate() {
        if (!this._platforms) {
            return '';
        }

        return html`
        ${this.platformsToEntries().map(
            (plat) => html`
            <div className="platform">
              <div className="platform__header">
                <h3 className="platform__title">${plat.key}</h3>
                <div>
                  <platforms-dialog
                    @save-platform=${this.savePlatform}
                    @delete-platform=${(ev) => this.removePlatform(ev.detail)}
                    .platform="${plat.key}"
                  ></platforms-dialog>
                  <ts-button
                    @click=${() => this.removePlatform(plat.key)}
                    variant="tertiary"
                  >
                    <span className="codicon codicon-trash"></span>
                  </ts-button>
                </div>
              </div>
              <div className="platform__content">
                ${this.transformsTemplate(plat)} ${this.formatsTemplate(plat)}
              </div>
            </div>
          `
        )}
      `;
    }

    transformsTemplate(platform: Platform) {
        return <div className="config-group">
            <h3>Transforms</h3>
            {platform.transformGroup ? this.transformGroupTemplate(platform) : ''}
            {platform.transforms
                ? this.standaloneTransformsTemplate(platform)
                : ''}
        </div>
            ;
    }

    transformGroupTemplate(platform: Platform) {
        return <div className="transform">
            <h4>${platform.transformGroup}</h4>
            <div className="text-small">
                {StyleDictionary.transformGroup[platform.transformGroup].join(', ')}
            </div>
        </div>;
    }

    standaloneTransformsTemplate(platform) {
        return html`
        ${platform.transforms.map(
            (transform) => html`
            <div className="transform">
              <h4>${transform}</h4>
            </div>
          `
        )}
      `;
    }

    formatsTemplate(platform) {
        return <div className="config-group">
            <h3>Formats</h3>
            <div className="formats-container">
                ${platform.files
                    ? platform.files.map(
                        (file) => html`
                    <div className="format">
                      <h4>${file.format}</h4>
                      <div className="format-file">
                        <svg
                          width="15"
                          height="16"
                          viewBox="0 0 15 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M3.5 2.5C3.22386 2.5 3 2.72386 3 3V13C3 13.2761 3.22386 13.5 3.5 13.5H11.5C11.7761 13.5 12 13.2761 12 13V6.5H8.5C8.22386 6.5 8 6.27614 8 6V2.5H3.5ZM9 3.20711L11.2929 5.5H9V3.20711ZM2 3C2 2.17157 2.67157 1.5 3.5 1.5H8.5C8.63261 1.5 8.75979 1.55268 8.85355 1.64645L12.8536 5.64645C12.9473 5.74021 13 5.86739 13 6V13C13 13.8284 12.3284 14.5 11.5 14.5H3.5C2.67157 14.5 2 13.8284 2 13V3Z"
                            fill="currentColor"
                          />
                        </svg>
                        ${file.destination}
                      </div>
                    </div>
                  `
                    )
                    : ''}
            </div>
        </div>
            ;
    }

    removeTransformGroup(platform: Platform) {
        const copy = structuredClone(this._platforms);
        delete this._platforms[platform].transformGroup;
        this.requestUpdate('_platforms', copy);
        const dialogEl = this.shadowRoot.querySelector(`[platform="${platform}"]`);
        dialogEl.onPlatformChanged();
    }

    removeFormat(platform, format) {
        const copy = structuredClone(this._platforms);
        this._platforms[platform].files = this._platforms[platform].files.filter(
            (file) => file.format !== format
        );
        this.requestUpdate('_platforms', copy);
        const dialogEl = this.shadowRoot.querySelector(`[platform="${platform}"]`);
        dialogEl.onPlatformChanged();
    }

    removePlatform(platform) {
        const copy = structuredClone(this._platforms);
        delete this._platforms[platform];
        this.requestUpdate('_platforms', copy);
    }

    savePlatform(ev) {
        const { detail } = ev;

        sdState.config = {
            ...sdState.config,
            platforms: {
                ...sdState.config.platforms,
                ...detail
            }
        };
    }
}