import { LionCheckbox } from "@lion/ui/checkbox-group.js";
import styles from "./segmented-choice.css.js";

export class SegmentedChoice extends LionCheckbox {
  static get styles() {
    return [...super.styles, styles];
  }

  constructor() {
    super();
    this.addEventListener("click", this.delegateClickEvent);
  }

  /**
   * Make the whole chip area clickable by delegating 'click' event
   * @param {Event} ev
   */
  delegateClickEvent(ev) {
    if (ev.target === this) {
      ev.stopImmediatePropagation();
      this._inputNode.click();
    }
  }
}
customElements.define("ts-segmented-choice", SegmentedChoice);
