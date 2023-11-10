import { css } from "lit";
import { LionRadio } from "@lion/ui/radio-group.js";

export class ConfigTab extends LionRadio {
  static get styles() {
    return [
      ...super.styles,
      css`
        :host {
          background-color: var(--bgCanvas);
          border: 1px solid transparent;
        }

        :host([checked]) {
          box-shadow: inset 0 -2px var(--accentEmphasis);
        }

        :host([focused]) {
          border-color: white;
        }

        :host(:hover),
        ::slotted([slot="label"]:hover) {
          cursor: pointer;
        }

        ::slotted([slot="label"]) {
          display: inline-block;
          user-select: none;
          padding: 6px;
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

  _connectSlotMixin() {
    super._connectSlotMixin();
    this._inputNode.classList.add("sr-only");
  }
}
customElements.define("config-tab", ConfigTab);
