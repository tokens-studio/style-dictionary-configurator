import { LitElement, html, css } from "lit";
import styles from "./button.css.js";

class Button extends LitElement {
  static styles = styles

  static get properties() {
    return {
      loading: {
        type: Boolean,
        reflect: true,
      },
      variant: {
        type: "primary" | "secondary" | "tertiary",
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
      <button type="button">
        <slot name="icon"></slot>
        <slot></slot>
      </button>
    `;
  }
}

customElements.define("ts-button", Button);
