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

    :host([size="small"]) button {
      width: 28px;
      height: 28px;
    }

    button:hover {
      background-color: var(--bgSubtle);
    }

    button:focus {
      box-shadow: var(--shadowsFocus);
      outline: 0;
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
      size: {
        type: "small" | "medium" | "large",
        reflect: true,
      }
    };
  }

  render() {
    return html`
      <button
        type="button"
        aria-label=${this.title}
      >
        <slot></slot>
      </button>
    `;
  }
}

customElements.define("ts-icon-button", IconButton);
