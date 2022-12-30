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

        /* .input-group__container > .input-group__input ::slotted(.form-control) {
          font-size: 1.2rem;
          padding: 0.5rem;
          background-color: #dddddd;
          width: 300px;
          color: black;
        } */

        #overlay-content-node-wrapper {
          max-width: 300px;
        }
      `,
    ];
  }

  // Hotfix override of lion, for combobox not opening properly on click/focusin
  __requestShowOverlay(ev) {
    if (ev && ev.key) {
      this.opened = true;
    }
  }

  _inputGroupInputTemplate() {
    return html`
      <div class="input-group__input">
        <slot name="input"></slot>
      </div>
    `;
  }

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

  _syncToTextboxMultiple(modelValue, oldModelValue = []) {
    super._syncToTextboxMultiple(modelValue, oldModelValue);
    if (this.opened) {
      console.log("ey");
      this.updateComplete.then(() => {
        this.repositionOverlay();
      });
    }
  }

  // get selectedOptions() {
  //   return Array.from(this._listboxNode.children).filter((child, id) => {
  //     if (Array.isArray(this.checkedIndex)) {
  //       return this.checkedIndex.find((i) => i === id);
  //     }
  //     return id === this.checkedIndex;
  //   });
  // }

  /** Override from LionCombobox.. */
  // __onOverlayClose() {
  //   if (!this.multipleChoice) {
  //     if (
  //       this.checkedIndex !== -1 &&
  //       this._syncToTextboxCondition(this.modelValue, this._oldModelValue, {
  //         phase: "overlay-close",
  //       })
  //     ) {
  //       // <-- the override
  //       this._inputNode.value = this.getTextboxValueFromOption(
  //         this.formElements[/** @type {number} */ (this.checkedIndex)]
  //       );
  //     }
  //   } else {
  //     this._syncToTextboxMultiple(this.modelValue, this._oldModelValue);
  //   }
  // }

  // getTextboxValueFromOption(option) {
  //   return option.choiceValue
  //     .replace(this._getCheckedElements()[0].song.artist, "")
  //     .trim();
  // }
}
customElements.define("sd-combobox", SdCombobox);
