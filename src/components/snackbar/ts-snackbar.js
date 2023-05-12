import { LitElement, html, css } from "lit";

export class TsSnackbar extends LitElement {
  static get styles() {
    return [
      css`
        .codicon[class*="codicon-"] {
          font: normal normal normal 16px/1 codicon;
          background-color: transparent;
          border: none;
          cursor: pointer;
        }

        .codicon-close:before {
          content: "\\ea76";
          position: absolute;
          right: 8px;
          top: 10px;
        }

        :host {
          display: inline-block;
          position: fixed;
          box-sizing: border-box;
          max-width: 750px;
          background-color: var(--dangerBg);
          color: var(--fgDefault);
          border-radius: 8px;
          border: 1px solid var(--dangerBorder);
          bottom: 16px;
          left: 50%;
          padding: 16px;
          transform: translate(-50%, calc(100% + 16px));
          transition: transform 0.3s ease-in-out;
        }

        :host([shown]) {
          transform: translate(-50%, 0);
        }

        p {
          margin: 0;
        }

        a {
          color: var(--fgSubtle);
        }
      `,
    ];
  }

  static get properties() {
    return {
      message: { state: true },
    };
  }

  close() {
    this.manager.closeCurrent();
  }

  render() {
    let messageTpl = this.message;
    if (typeof this.message === "string") {
      const splitMessagesByNewLines = this.message?.split("\n");
      messageTpl = splitMessagesByNewLines?.reduce(
        (acc, curr) => html`${acc}<br />${curr}`
      );
    }
    return html`<span @click=${this.close} class="codicon codicon-close"></span>
      <span class="text">${messageTpl}</span> `;
  }
}
customElements.define("ts-snackbar", TsSnackbar);
