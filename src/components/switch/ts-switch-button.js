import { LionSwitchButton } from "@lion/ui/switch.js";
import styles from "./ts-switch-button.css.js";

export class SwitchButton extends LionSwitchButton {
  static get styles() {
    return [...super.styles, styles];
  }

  /** @override LionSwitchButton */
  _handleKeyup(ev) {
    switch (ev.key) {
      case " ":
      case "Enter":
        this._toggleChecked();
        break;
      case "ArrowRight":
        if (!this.checked) {
          this._toggleChecked();
        }
        break;
      case "ArrowLeft":
        if (this.checked) {
          this._toggleChecked();
        }
        break;
      /* no default */
    }
  }
}

customElements.define("ts-switch-button", SwitchButton);
