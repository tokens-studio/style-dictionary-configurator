import { css, html } from "lit";
import { LionOption } from "@lion/ui/listbox.js";

export class SdOption extends LionOption {
  static get styles() {
    return [
      ...super.styles,
      css`
        :host {
          background-color: var(--bgDefault);
          padding: var(--space2);
          border-radius: var(--radiiSmall);
          font-size: var(--fontSizesXsmall);
          color: var(--fgDefault);
        }

        :host(:hover) {
          background-color: var(--bgSubtle);
        }

        :host([checked]) {
          background-color: var(--accentBg);
        }

        :host([active]) {
          background-color: var(--bgSubtle);
        }

        ::slotted(.match-highlight),
        .match-highlight {
          font-weight: var(--fontWeightsSansMedium);
        }
      `,
    ];
  }

  static get properties() {
    return {
      group: {
        type: Boolean,
        reflect: true,
      },
    };
  }

  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);
    this.__originalInnerHTML = this.innerHTML;
  }

  /**
   * override from LionOption
   * @param {string} matchingString
   */
  onFilterMatch(matchingString) {
    this.innerHTML = this.__originalInnerHTML;
    /** @param {string} text */
    const regEscape = (text) =>
      text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    this.innerHTML = this.innerHTML.replace(
      new RegExp(`(${regEscape(matchingString)})`, "i"),
      `<span class="match-highlight">$1</span>`
    );

    this.style.display = "";
  }

  render() {
    return html`
      <div class="choice-field__label">
        <input
          type="checkbox"
          name="visual-state"
          aria-hidden="true"
          ?checked=${this.checked}
        />
        <slot></slot>
      </div>
    `;
  }
}
customElements.define("sd-option", SdOption);
