import { css, html } from "lit";
import { LionCombobox } from "@lion/ui/combobox.js";

class SdCombobox extends LionCombobox {
  static get properties() {
    return {
      selectionDisplayPosition: {
        type: String,
        reflect: true,
        attribute: "selection-display-position",
      },
    };
  }

  static get styles() {
    return [
      ...super.styles,
      css`
        * > ::slotted([slot="listbox"]) {
          max-height: 300px;
          background-color: var(--bgDefault);
        }

        #overlay-content-node-wrapper {
          max-width: 300px;
        }
      `,
    ];
  }

  constructor() {
    super();
    this.selectionDisplayPosition = "before";
  }

  /**
   * @override Lion OverlayMixin
   * Hotfix override of lion, for combobox not opening properly on click/focusin
   */
  __requestShowOverlay(ev) {
    if (ev && ev.key) {
      this.opened = true;
    }
  }

  /**
   * @override Lion FormControlMixin
   * Remove selection display slot from input
   */
  _inputGroupInputTemplate() {
    return html`
      <div class="input-group__input">
        <slot name="input"></slot>
      </div>
    `;
  }

  /**
   * @override Lion FormControlMixin
   * Move selection display slot before or after input-group
   */
  _inputGroupTemplate() {
    const selectionDisplay = html`<slot name="selection-display"></slot>`;
    return html`
      ${this.selectionDisplayPosition === "before" ? selectionDisplay : ""}

      <div class="input-group">
        ${this._inputGroupBeforeTemplate()}
        <div class="input-group__container">
          ${this._inputGroupPrefixTemplate()} ${this._inputGroupInputTemplate()}
          ${this._inputGroupSuffixTemplate()}
        </div>
        ${this._inputGroupAfterTemplate()}
      </div>

      ${this.selectionDisplayPosition === "after" ? selectionDisplay : ""}
    `;
  }

  /**
   * @override LionCombobox
   * Reposition the overlay, since syncing to textbox adds items to the
   * selection display element, causing layout shifts when they wrap to new line
   */
  _syncToTextboxMultiple(modelValue, oldModelValue = []) {
    super._syncToTextboxMultiple(modelValue, oldModelValue);
    if (this.opened) {
      this.updateComplete.then(() => {
        this.repositionOverlay();
      });
    }
  }
}
customElements.define("sd-combobox", SdCombobox);
