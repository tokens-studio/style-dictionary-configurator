import { css } from "lit";
import { LionRadioGroup } from "@lion/ui/radio-group.js";

class ConfigTabGroup extends LionRadioGroup {
  static get styles() {
    return [
      ...super.styles,
      css`
        .input-group {
          display: flex;
          gap: 2px;
        }
      `,
    ];
  }
}
customElements.define("config-tab-group", ConfigTabGroup);
