import { LitElement, html, css } from "lit";

class IconButton extends LitElement {
  static styles = css`
    button {
      border: 0;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radiiSmall);
      background-color: transparent;
      cursor: pointer;
      color: var(--fgDefault);
    }

    button:hover {
      background-color: var(--bgSubtle);
    }
  `;

  static get properties() {
    return {
      icon: {
        type: String,
        reflect: true,
      },
      title: {
        type: String,
        reflect: true,
      },
    };
  }

  render() {
    return html`
      <button
        type="button"
        @click=${(e) => {
          this.dispatchEvent(new CustomEvent("click"));
        }}
        aria-label=${this.title}
      >
        <slot></slot>
      </button>
    `;
  }
}

customElements.define("ts-icon-button", IconButton);
