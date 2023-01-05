import { css, html } from "lit";
import { LionCombobox } from "@lion/ui/combobox.js";

class SdCombobox extends LionCombobox {
  static get styles() {
    return [
      ...super.styles,
      css`
        * > ::slotted([slot="listbox"]) {
          max-height: 300px;
          background-color: var(--bg-color);
        }

        #overlay-content-node-wrapper {
          max-width: 300px;
        }
      `,
    ];
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
   */
  _inputGroupTemplate() {
    return html`
      <slot name="selection-display"></slot>
      <div class="input-group">
        ${this._inputGroupBeforeTemplate()}
        <div class="input-group__container">
          ${this._inputGroupPrefixTemplate()} ${this._inputGroupInputTemplate()}
          ${this._inputGroupSuffixTemplate()}
        </div>
        ${this._inputGroupAfterTemplate()}
      </div>
    `;
  }

  /**
   * @override LionCombobox
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
