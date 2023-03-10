import { LitElement, html, css } from "lit";

export class TsSnackbar extends LitElement {
  static get styles() {
    return [
      css`
        :host {
          display: inline-block;
          position: fixed;
          box-sizing: border-box;
          max-width: 750px;
          background-color: var(--accentBg);
          color: var(--fgDefault);
          border-radius: 8px;
          border: 1px solid var(--borderDefault);
          bottom: 16px;
          left: 50%;
          padding: 16px;
          transform: translate(-50%, calc(100% + 16px));
          transition: transform 0.3s ease-in-out;
        }

        :host([shown]) {
          transform: translate(-50%, 0);
        }
      `,
    ];
  }

  static get properties() {
    return {
      message: { state: true },
    };
  }

  render() {
    const splitMessagesByNewLines = this.message?.split("\n");
    const messageTpl = splitMessagesByNewLines?.reduce(
      (acc, curr) => html`${acc}<br />${curr}`
    );
    return html` <span class="text">${messageTpl}</span> `;
  }
}
customElements.define("ts-snackbar", TsSnackbar);
