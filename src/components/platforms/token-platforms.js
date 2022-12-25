import StyleDictionary from "browser-style-dictionary/browser.js";
import { LitElement, css, html } from "lit";
import { sdState } from "../../style-dictionary.js";
import "../collapsible/sd-collapsible.js";

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

      h2 {
        text-align: center;
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

      .transform__collapsible[opened] .transform-group__btn::after {
        content: "-";
      }

      .formats-container {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .format {
        padding: 0.5rem;
      }
    `;
  }

  static get properties() {
    return {
      _platforms: {
        state: true,
      },
    };
  }

  connectedCallback() {
    super.connectedCallback();
    this.setupSdListeners();
  }

  async setupSdListeners() {
    await sdState.hasInitialized;
    this._platforms = sdState.sd.platforms;
    sdState.addEventListener("sd-changed", (ev) => {
      this._platforms = ev.detail.platforms;
    });
  }

  render() {
    return html`
      <h2>Platforms</h2>
      <div class="platforms-container">${this.platformsTemplate()}</div>
    `;
  }

  platformsTemplate() {
    if (!this._platforms) {
      return "";
    }

    const platforms = Object.entries(this._platforms).map(([key, plat]) => ({
      ...plat,
      key,
    }));

    return html`${platforms.map(
      (plat) => html`
        <div class="platform border">
          <div class="platform__header">
            <p class="platform__title">${plat.key}</p>
            <button
              aria-label="edit platform"
              class="codicon codicon-edit"
            ></button>
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
        ${platform.transformGroup
          ? this.transformGroupTemplate(platform.transformGroup)
          : ""}
        <!-- Transforms standalone -->
        ${platform.transforms
          ? this.standaloneTransformsTemplate(platform.transforms)
          : ""}
      </div>
    `;
  }

  transformGroupTemplate(transformGroup) {
    return html`
      <div class="transform-group-container">
        <sd-collapsible class="transform__collapsible">
          <button slot="invoker" class="transform-group__btn">
            ${transformGroup}
          </button>
          <ul slot="content">
            ${StyleDictionary.transformGroup[transformGroup].map(
              (transform) => html` <li>${transform}</li> `
            )}
          </ul>
        </sd-collapsible>
      </div>
    `;
  }

  standaloneTransformsTemplate(transforms) {
    return html`
      ${transforms.map(
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
}

customElements.define("token-platforms", TokenPlatforms);
