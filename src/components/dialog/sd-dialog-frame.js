import { LitElement, html, css } from "lit";

class SdDialogFrame extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
        width: 600px;
        position: relative;
        box-shadow: 0 3px 5px 1px rgba(0, 0, 0, 0.4);
      }

      .close-btn {
        position: absolute;
        top: 0.25rem;
        right: 0.25rem;
        margin: 0;
        font-size: 2rem;
        line-height: 2rem;
      }

      ::slotted([slot="header"]) {
        text-align: center !important;
        padding: 0.75rem !important;
        border-bottom: 1px solid black !important;
        font-weight: bold !important;
        font-size: 1.5rem !important;
        line-height: 1.5rem !important;
      }
    `;
  }

  static get properties() {
    return {
      hasCloseButton: {
        type: Boolean,
        reflect: true,
        attribute: "has-close-button",
      },
    };
  }

  render() {
    return html`
      ${this.hasCloseButton
        ? html`
            <button
              variation="text"
              class="close-btn"
              @click=${() => {
                this.dispatchEvent(
                  new Event("close-overlay", { bubbles: true })
                );
              }}
            >
              ✖
            </button>
          `
        : ""}
      <slot name="header"></slot>
      <div class="content-container">
        <slot name="content"></slot>
        <slot name="footer"></slot>
      </div>
    `;
  }
}

customElements.define("sd-dialog-frame", SdDialogFrame);
