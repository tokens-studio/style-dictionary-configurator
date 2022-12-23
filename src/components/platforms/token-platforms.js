import StyleDictionary from "browser-style-dictionary/browser.js";
import { LitElement, css, html } from "lit";
import { sdState } from "../../style-dictionary.js";
import "../collapsible/sd-collapsible.js";

class TokenPlatforms extends LitElement {
  static get styles() {
    return css`
      h2 {
        text-align: center;
      }

      .transform-group-btn {
        font-size: 1rem;
        position: relative;
        padding: 15px 25px;
      }

      .transform-group-btn::after {
        content: "group";
        font-size: 0.75rem;
        position: absolute;
        bottom: 0;
        right: 0;
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

    console.log(
      platforms,
      StyleDictionary.transformGroup,
      StyleDictionary.transform
    );
    return html`${platforms.map(
      (plat) => html`
        <p>${plat.key}</p>
        <!-- TODO: separate below into separate templates -->
        <p>Transforms</p>

        <!-- Transform Groups -->
        ${plat.transformGroup
          ? html`
              <sd-collapsible>
                <button slot="invoker" class="transform-group-btn">
                  ${plat.transformGroup}
                </button>
                <ul slot="content">
                  ${StyleDictionary.transformGroup[plat.transformGroup].map(
                    (transform) => html` <li>${transform}</li> `
                  )}
                </ul>
              </sd-collapsible>
            `
          : ""}

        <!-- Transforms standalone -->
        ${plat.transforms
          ? plat.transforms.map(
              (transform) => html`
                <div class="transform-container">${transform}</div>
                <!-- TODO: Add delete button for the transform -->
              `
            )
          : ""}

        <!-- Formats -->
        <p>Formats</p>
      `
    )}`;
  }
}

customElements.define("token-platforms", TokenPlatforms);
