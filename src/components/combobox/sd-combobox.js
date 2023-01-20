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
        :host .input-group__container {
          border-bottom: none;
          height: 100%;
        }

        :host .input-group {
          flex-grow: 1;
          min-width: 90px;
        }

        :host > .form-field__group-two {
          font-weight: var(--fontWeightsSansRegular);
          display: flex;
          justify-content: flex-start;
          flex-wrap: wrap;
          border-radius: var(--radiiSmall);
          font-size: var(--fontSizesSmall) !important; // have to override due to some css inside doing weird stuff
          color: var(--fgDefault);
          line-height: 1;
          background-color: var(--inputBg);
          border: 1px solid var(--inputBorderRest);
          min-height: 32px;
        }

        * > ::slotted([slot="label"]) {
          display: flex;
          flex-direction: column;
          color: var(--fgDefault);
          width: 100%;
          gap: var(--space2);
          font-weight: var(--fontWeightsSansMedium);
          font-size: var(--fontSizesSmall);
        }
        * > ::slotted([slot="input"]) {
          background: var(--inputBg);
          color: var(--fgDefault);
        }

        * > ::slotted([slot="help-text"]) {
          font-size: var(--fontSizesXsmall);
          color: var(--fgMuted);
        }

        * > ::slotted([slot="listbox"]) {
          max-height: 300px;
          margin-top: var(--space2);
          background-color: var(--bgDefault);
          box-shadow: var(--shadowsSmall);
          border: 1px solid var(--borderSubtle);
          border-radius: var(--radiiMedium);
          padding: var(--space3);
        }

        #overlay-content-node-wrapper {
          max-width: 300px;
        }

        * > ::slotted([slot="input"]) {
          
        }
        * > ::slotted([slot="input"]):focus-visible {
          box-shadow: var(--shadowsFocus);
          outline: none;
        }

        * > :slotted > .input-group__container {
          border-bottom: none;
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
