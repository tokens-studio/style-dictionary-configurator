import { html, css } from "lit";
import { LionCheckbox } from "@lion/ui/checkbox-group.js";

export class ConfigSwitcher extends LionCheckbox {
  static get styles() {
    return [
      ...super.styles,
      css`
        :host {
          position: absolute;
          left: 0px;
          top: -1px;
          background-color: var(--bgSubtle);
          padding: 6px;
          transform: translateY(-100%);
        }

        :host([focused]) {
          outline: 1px solid white;
        }

        :host(:hover) {
          filter: brightness(1.2);
        }

        :host(:hover),
        ::slotted([slot="label"]:hover) {
          cursor: pointer;
        }

        ::slotted([slot="label"]) {
          user-select: none;
        }

        ::slotted(.sr-only) {
          position: absolute;
          top: 0;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip-path: inset(100%);
          clip: rect(1px, 1px, 1px, 1px);
          white-space: nowrap;
          border: 0;
          margin: 0;
          padding: 0;
        }
      `,
    ];
  }

  constructor() {
    super();
    this.labelToFunctions = "Register Style-Dictionary functions";
    this.labelToConfig = "Back to configuration";
    this.label = this.labelToFunctions;
  }

  _connectSlotMixin() {
    super._connectSlotMixin();
    this._inputNode.classList.add("sr-only");
  }

  _onModelValueChanged({ modelValue }, old) {
    super._onModelValueChanged({ modelValue }, old);
    this.label = this.checked ? this.labelToConfig : this.labelToFunctions;
  }
}
customElements.define("config-switcher", ConfigSwitcher);
