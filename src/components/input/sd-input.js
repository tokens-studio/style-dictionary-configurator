import { LitElement, html, css } from "lit";
import styles from "./sd-input.css.js";

class SdInput extends LitElement {
  static styles = styles;

  static get properties() {
    return {
      label: {
        type: String,
        reflect: true,
      },
      value: {
        type: String,
        reflect: true,
      },
      placeholder: {
        type: String,
        reflect: true,
      },
    };
  }

  render() {
    return html`
      <label>
        ${this.label}
        <input
          type="text"
          placeholder=${this.placeholder}
          @input=${(e) => {
            this.value = e.target.value;
            // emit value change event
            this.dispatchEvent(
              new CustomEvent("alue-vchanged", {
                detail: {
                  value: this.value,
                },
              })
            );
          }}
          value=${this.value}
        />
      </label>
    `;
  }
}

customElements.define("sd-input", SdInput);
