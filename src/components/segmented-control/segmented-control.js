import { html } from "lit";
import { LionCheckboxGroup } from "@lion/ui/checkbox-group.js";
import styles from "./segmented-control.css.js";

export class SegmentedControl extends LionCheckboxGroup {
  static get styles() {
    return [...super.styles, styles];
  }

  /**
   * @override Lion FormControlMixin, to wrap with a containing div for styling
   */
  _groupTwoTemplate() {
    return html`
      <div class="control-choice-container">${this._inputGroupTemplate()}</div>
    `;
  }
}
customElements.define("ts-segmented-control", SegmentedControl);
