import { LitElement, html, css } from "lit";
import XIcon from "../../icons/x.svg.js";

import "../button/ts-button.js";

class SdDialogFrame extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
        width: 600px;
        position: relative;
        box-shadow: var(--shadowDefault);
        background-color: var(--bgDefault);
        border: 1px solid var(--borderSubtle);
        border-radius: var(--radiiMedium);
      }

      .header {
        display: flex;
        justify-content: space-between;
        padding: var(--space3);
      }

      .header-text {
        padding: var(--space3);
        font-size: var(--fontSizesLarge);
        font-weight: var(--sansMedium);
        color: var(--fgDefault);
      }

      ::slotted([slot="content"]) {
        padding: 0 var(--space5);
      }
    `;
  }

  static get properties() {
    return {
      hasCloseButton: {
        type: Boolean,
        attribute: "has-close-button",
      },
      title: {
        type: String,
      },
    };
  }

  render() {
    return html`
      <div class="header">
        <div class="header-text">${this.title}</div>
        ${this.hasCloseButton
          ? html`
              <ts-button
                variant="tertiary"
                aria-label="Close"
                @click=${() => {
                  this.dispatchEvent(
                    new Event("close-overlay", { bubbles: true })
                  );
                }}
              >
                ${XIcon}
              </ts-button>
            `
          : ""}
      </div>
      <div class="content-container">
        <slot name="content"></slot>
        <slot name="footer"></slot>
      </div>
    `;
  }
}

customElements.define("sd-dialog-frame", SdDialogFrame);
