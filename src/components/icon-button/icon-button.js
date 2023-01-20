import { LitElement, html, css } from "lit";
import styles from "./icon-button.css.js";
class IconButton extends LitElement {
  static styles = styles;

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
