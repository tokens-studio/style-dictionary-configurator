import { LitElement, html, css } from "lit";

class SdInput extends LitElement {
  static styles = css`
    label {
      display: flex;
      flex-direction: column;
      color: var(--fgDefault);
      width: 100%;
      gap: var(--space2);
      font-weight: var(--fontWeightsSansMedium);
      font-size: var(--fontSizesSmall);
    }

    input {
      font-weight: var(--fontWeightsSansRegular);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radiiSmall);
      padding: 0 var(--space4);
      height: 32px;
      font-size: var(--fontSizesSmall);
      color: var(--fgDefault);
      line-height: 1;
      background-color: var(--inputBg);
      border: 1px solid var(--inputBorderRest);
    }

    input:focus-visible {
      box-shadow: var(--shadowsFocus);
      outline: none;
    }
  `;

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
