import { css, html } from "lit";
import { LionOption } from "@lion/ui/listbox.js";

export class SdOption extends LionOption {
  static get styles() {
    return [
      ...super.styles,
      css`
        ::slotted(.match-highlight),
        .match-highlight {
          font-weight: bold;
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
        <slot></slot>
        ${this.group ? html` <span class="group">(group)</span> ` : ""}
      </div>
    `;
  }
}
customElements.define("sd-option", SdOption);
