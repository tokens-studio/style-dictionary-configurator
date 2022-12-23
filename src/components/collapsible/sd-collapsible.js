import { LionCollapsible } from "@lion/ui/collapsible.js";
import { css } from "lit";

class SdCollapsible extends LionCollapsible {
  static get styles() {
    return [...super.styles, css``];
  }
}

customElements.define("sd-collapsible", SdCollapsible);
