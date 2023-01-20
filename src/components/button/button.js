import { LitElement, html, css } from "lit";

class Button extends LitElement {
  static styles = css`
    button {
      border-width: 1px;
      border-style: solid;
      border-color: transparent;
      display: inline-flex;
      align-items: center;
      gap: var(--space2);
      border-radius: var(--radiiMedium);
      line-height: 20px;
      font-weight: var(--fontWeightsSansMedium);
      position: relative;
      box-shadow: var(--shadowsSmall);
      cursor: pointer;

      /* Move to size later on */
      padding: var(--space3) var(--space4);
      fontSize: var(--fontSizesSmall);
    }

    :host([variant="primary"]) button {
      background: var(--buttonPrimaryBgRest);
      color: var(--buttonPrimaryFg);
    }

    :host([variant="primary"]) button:hover {
      background-color: var(--buttonPrimaryBgHover);
    }

    :host([variant="secondary"]) button {
      background: var(--buttonSecondaryBgRest);
      color: var(--buttonSecondaryFg);
      border-color: var(--buttonSecondaryBorderRest);
    }

    :host([variant="secondary"]) button:hover {
      background-color: var(--buttonSecondaryBgHover);
    }

    button:focus {
      box-shadow: var(--shadowsFocus);
      outline: 0;
    }
  `;

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
