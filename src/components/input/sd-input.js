import { LionInput } from "@lion/ui/input.js";
import styles from "./sd-input.css.js";

class SdInput extends LionInput {
  static get styles() {
    return [...super.styles, styles];
  }
}

customElements.define("sd-input", SdInput);
