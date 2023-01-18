import { LitElement, html, css } from "lit";

class SdDialogFrame extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
        width: 600px;
        position: relative;
        box-shadow: var(--shadowDefault);
        background-color: var(--bgDefault);
        border: 1px solid var(--borderDefault);
        border-radius: var(--radiiMedium);
      }

      .header {
        display: flex;
        justify-content: space-between;
        padding: var(--space2);
      }

      .header-text {
        padding: var(--space3);
        font-size: var(--fontSizesLarge);
        font-weight: var(--sansMedium);
        color: var(--fgDefault);
      }

      ::slotted([slot="content"]) {
        padding: var(--space4);
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
      title: {
        type: String,
        reflect: true,
      },
    };
  }

  render() {
    return html`
      <div class="header">
        <div class="header-text">${this.title}</div>
        ${this.hasCloseButton
          ? html`
              <icon-button
                title="Close"
                @click=${() => {
                  this.dispatchEvent(
                    new Event("close-overlay", { bubbles: true })
                  );
                }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 15 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12.8536 2.85355C13.0488 2.65829 13.0488 2.34171 12.8536 2.14645C12.6583 1.95118 12.3417 1.95118 12.1464 2.14645L7.5 6.79289L2.85355 2.14645C2.65829 1.95118 2.34171 1.95118 2.14645 2.14645C1.95118 2.34171 1.95118 2.65829 2.14645 2.85355L6.79289 7.5L2.14645 12.1464C1.95118 12.3417 1.95118 12.6583 2.14645 12.8536C2.34171 13.0488 2.65829 13.0488 2.85355 12.8536L7.5 8.20711L12.1464 12.8536C12.3417 13.0488 12.6583 13.0488 12.8536 12.8536C13.0488 12.6583 13.0488 12.3417 12.8536 12.1464L8.20711 7.5L12.8536 2.85355Z"
                    fill="currentColor"
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                  ></path></svg
              ></icon-button>
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
