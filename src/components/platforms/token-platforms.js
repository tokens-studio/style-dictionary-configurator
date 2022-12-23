import { LitElement, css, html } from "lit";
import { sdState } from "../../style-dictionary.js";

class TokenPlatforms extends LitElement {
  static get styles() {
    return css`
      h2 {
        text-align: center;
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
      <ul>
        ${this._platforms
          ? Object.entries(this._platforms).map(([key, plat]) => {
              console.log(plat);
              return html` <li>${key} ${plat?.transformGroup}</li> `;
            })
          : ""}
      </ul>
    `;
  }
}

customElements.define("token-platforms", TokenPlatforms);
