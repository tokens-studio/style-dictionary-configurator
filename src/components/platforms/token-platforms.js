import { LitElement, css, html } from "lit";

class TokenPlatforms extends LitElement {
  static get styles() {
    return css`
      h2 {
        text-align: center;
      }
    `;
  }
  render() {
    return html` <h2>Platforms</h2> `;
  }
}

customElements.define("token-platforms", TokenPlatforms);
