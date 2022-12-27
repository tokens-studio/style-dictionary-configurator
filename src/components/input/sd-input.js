import { css } from "lit";
import { LionInput } from "@lion/ui/input.js";

class SdInput extends LionInput {
  static get styles() {
    return [...super.styles, css``];
  }
}

customElements.define("sd-input", SdInput);
