import { html, css, LitElement } from "lit";
import { CONFIG, FUNCTIONS } from "../../constants.js";
import "./config-tab-group.js";
import "./config-tab.js";

const capitalizeFirstLetter = (str) =>
  str.charAt(0).toUpperCase() + str.slice(1);

export class ConfigSwitcher extends LitElement {
  static get properties() {
    return {
      checkedChoice: { state: true, hasChanged: () => true },
    };
  }

  static get styles() {
    return [
      css`
        :host {
          position: absolute;
          left: 0px;
          top: -1px;
          transform: translateY(-100%);
        }
      `,
    ];
  }

  constructor() {
    super();
    this.checkedChoice = CONFIG;
  }

  tabGroupChanged(ev) {
    const { detail } = ev;
    if (detail.isTriggeredByUser) {
      this.checkedChoice = ev.target.modelValue;
    }
  }

  updated(changedProperties) {
    if (changedProperties.has("checkedChoice")) {
      this.dispatchEvent(new Event("checked-changed"));
    }
  }

  render() {
    return html`
      <config-tab-group @model-value-changed=${this.tabGroupChanged}>
        <config-tab
          checked
          name="config-switcher"
          .choiceValue=${CONFIG}
          label="${capitalizeFirstLetter(CONFIG)}"
        ></config-tab>
        <config-tab
          name="config-switcher"
          .choiceValue=${FUNCTIONS}
          label="${capitalizeFirstLetter(FUNCTIONS)}"
        ></config-tab
      ></config-tab-group>
    `;
  }
}
customElements.define("config-switcher", ConfigSwitcher);
