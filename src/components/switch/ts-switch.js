import { LionSwitch } from "@lion/ui/switch.js";
import styles from "./ts-switch.css.js";

import "./ts-switch-button.js";

export class Switch extends LionSwitch {
  static get styles() {
    return [...super.styles, styles];
  }

  get slots() {
    return {
      ...super.slots,
      input: () => {
        const btnEl = document.createElement("ts-switch-button");
        return btnEl;
      },
    };
  }
}

customElements.define("ts-switch", Switch);
