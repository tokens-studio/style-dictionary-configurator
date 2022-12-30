// eslint-disable-next-line max-classes-per-file
import { LitElement, html, css, nothing } from "lit";

/**
 * Disclaimer: this is just an example component demoing the selection display of LionCombobox
 * It needs an 'a11y plan' and tests before it could be released
 */

/**
 * Renders the wrapper containing the textbox that triggers the listbox with filtered options.
 * Optionally, shows 'chips' that indicate the selection.
 * Should be considered an internal/protected web component to be used in conjunction with SdCombobox
 */
export class SdSelectionDisplay extends LitElement {
  static get properties() {
    return {
      comboboxElement: { attribute: false },
      /**
       * Can be used to visually indicate the next
       */
      removeChipOnNextBackspace: { attribute: false },
      selectedElements: { attribute: false },
    };
  }

  static get styles() {
    return css`
      :host {
        display: flex;
      }

      .combobox__selection {
        flex: none;
      }

      .combobox__input {
        display: block;
      }

      .selection-chip {
        border-radius: 4px;
        background-color: #eee;
        padding: 4px;
        font-size: 10px;
      }

      .selection-chip--highlighted {
        background-color: #ccc;
      }

      * > ::slotted([slot="_textbox"]) {
        outline: none;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        border: none;
        border-bottom: 1px solid;
      }
    `;
  }

  /**
   * @configure FocusMixin
   */
  get _inputNode() {
    return this.comboboxElement._inputNode;
  }

  computeSelectedElements() {
    const { formElements, checkedIndex } = this.comboboxElement;
    const checkedIndexes = Array.isArray(checkedIndex)
      ? checkedIndex
      : [checkedIndex];
    return formElements.filter((_, i) => checkedIndexes.includes(i));
  }

  get multipleChoice() {
    return this.comboboxElement?.multipleChoice;
  }

  constructor() {
    super();

    this.selectedElements = [];

    this.textboxOnKeyup = this.textboxOnKeyup.bind(this);
    this.restoreBackspace = this.restoreBackspace.bind(this);
  }

  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);

    if (this.multipleChoice) {
      this._inputNode.addEventListener("keyup", this.textboxOnKeyup);
      this._inputNode.addEventListener("focusout", this.restoreBackspace);
    }
  }

  // Fired on this element (selection-display slottable) by the combobox
  onComboboxElementUpdated(changedProperties) {
    if (changedProperties.has("modelValue")) {
      this.selectedElements = this.computeSelectedElements();
    }
  }

  /**
   * Whenever selectedElements are updated, makes sure that latest added elements
   * are shown latest, and deleted elements respect existing order of chips.
   */
  reorderChips() {
    const { selectedElements } = this;
    if (this.__prevSelectedEls) {
      const addedEls = selectedElements.filter(
        (e) => !this.__prevSelectedEls.includes(e)
      );
      const deletedEls = this.__prevSelectedEls.filter(
        (e) => !selectedElements.includes(e)
      );
      if (addedEls.length) {
        this.selectedElements = [...this.__prevSelectedEls, ...addedEls];
      } else if (deletedEls.length) {
        deletedEls.forEach((delEl) => {
          this.__prevSelectedEls.splice(
            this.__prevSelectedEls.indexOf(delEl),
            1
          );
        });
        this.selectedElements = this.__prevSelectedEls;
      }
    }
    this.__prevSelectedEls = this.selectedElements;
  }

  selectedElementTemplate(option, highlight) {
    return html`
      <span
        class="selection-chip ${highlight ? "selection-chip--highlighted" : ""}"
      >
        ${option.value}
      </span>
    `;
  }

  selectedElementsTemplate() {
    if (!this.multipleChoice) {
      return nothing;
    }
    return html`
      <div class="combobox__selection">
        ${this.selectedElements.map((option, i) => {
          const highlight = Boolean(
            this.removeChipOnNextBackspace &&
              i === this.selectedElements.length - 1
          );
          return this.selectedElementTemplate(option, highlight);
        })}
      </div>
    `;
  }

  render() {
    return html` ${this.selectedElementsTemplate()} `;
  }

  textboxOnKeyup(ev) {
    if (ev.key === "Backspace") {
      if (!this._inputNode.value) {
        if (this.removeChipOnNextBackspace && this.selectedElements.length) {
          this.selectedElements[
            this.selectedElements.length - 1
          ].checked = false;
        }
        this.removeChipOnNextBackspace = true;
      }
    } else {
      this.removeChipOnNextBackspace = false;
    }
  }

  restoreBackspace() {
    this.removeChipOnNextBackspace = false;
  }
}
customElements.define("sd-selection-display", SdSelectionDisplay);
