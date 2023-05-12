import { html, LitElement, css } from "lit";
import { parseTransformOptions } from "../../ast/parseTransformOptions.js";
import { codicon } from "../../icons/codicon-style.css.js";
import styles from "../platforms/platforms-dialog.css.js";
import "../dialog/sd-dialog.js";
import "../dialog/sd-dialog-frame.js";
import "../input/sd-input.js";
import "../button/ts-button.js";
import "../button/ts-button-submit.js";
import "../form/sd-form.js";
import "../checkbox/sd-checkbox-group.js";
import "../checkbox/sd-checkbox.js";
import { syncTransformOptionsWithUI } from "../../ast/syncTransformOptionsWithUI.js";
import { snackbar } from "../snackbar/SnackbarManager.js";

class SettingsDialog extends LitElement {
  static get properties() {
    return {
      settings: {
        attribute: false,
      },
    };
  }

  static get styles() {
    return [
      codicon,
      styles,
      css`
        .codicon-settings-gear:before {
          content: "\\eb51";
        }

        label {
          color: var(--fgDefault);
        }
      `,
    ];
  }

  constructor() {
    super();
    this.settings = null;
    this.boundParseSettings = this.parseSettings.bind(this);

    window.addEventListener("sd-functions-saved", this.boundParseSettings);
    window.addEventListener("input-files-created", this.boundParseSettings);
  }

  render() {
    return html`
      ${this.settings
        ? html`
            <sd-dialog @before-opened=${this.checkIfCanOpen}>
              <ts-button slot="invoker" variant="secondary">
                Settings <span class="codicon codicon-settings-gear"></span>
              </ts-button>
              <sd-dialog-frame
                class="dialog__frame"
                title="Change settings"
                has-close-button
                slot="content"
              >
                <div slot="content">${this.formTemplate()}</div>
              </sd-dialog-frame>
            </sd-dialog>
          `
        : html``}
    `;
  }

  formTemplate() {
    return html`
      <sd-form class="platform-form" @submit="${this.submitForm}">
        <form>
          <sd-checkbox-group name="settings" label="Settings">
            <sd-checkbox
              label="Exclude Parent Keys"
              .choiceValue=${"excludeParentKeys"}
              ?checked=${this.settings.excludeParentKeys}
            ></sd-checkbox>
            <sd-checkbox
              expand
              label="Expand Composition Tokens"
              .choiceValue=${"composition"}
              ?disabled=${this.settings.expand.composition === "__function__"}
              ?checked=${this.settings.expand.composition}
            ></sd-checkbox>
            <sd-checkbox
              expand
              label="Expand Typography Tokens"
              .choiceValue=${"typography"}
              ?disabled=${this.settings.expand.typography === "__function__"}
              ?checked=${this.settings.expand.typography}
            ></sd-checkbox>
            <sd-checkbox
              expand
              label="Expand Border Tokens"
              .choiceValue=${"border"}
              ?disabled=${this.settings.expand.border === "__function__"}
              ?checked=${this.settings.expand.border}
            ></sd-checkbox>
            <sd-checkbox
              expand
              label="Expand Shadow Tokens"
              .choiceValue=${"shadow"}
              ?disabled=${this.settings.expand.shadow === "__function__"}
              ?checked=${this.settings.expand.shadow}
            ></sd-checkbox>
          </sd-checkbox-group>
          <ts-button-submit variant="primary">Save</ts-button-submit>
        </form>
      </sd-form>
    `;
  }

  parseSettings() {
    this.settings = parseTransformOptions().currentOptions;
    if (this.settings.expand === undefined) {
      this.settings.expand = {};
    }

    // false by default
    this.settings.expand.composition =
      this.settings.expand.composition !== false;
  }

  checkIfCanOpen(ev) {
    // prevent opening of settings if __functions__ are used inside sd-transforms options
    // This makes the options param not statically analyzable for us, to operate on it through UI
    if (
      [
        ...ev.target.querySelectorAll(
          'sd-checkbox-group[name="settings"] > sd-checkbox'
        ),
      ].some((checkEl) => checkEl.disabled)
    ) {
      ev.preventDefault();
      snackbar.show(
        `You are using functions inside your sd-transforms settings.
This means we cannot let you configure the settings in code through the UI anymore, as it is too complex of an operation.
Please adjust the settings in code instead.`,
        10000
      );
    }
  }

  submitForm(ev) {
    ev.preventDefault();
    ev.target.dispatchEvent(new Event("close-overlay", { bubbles: true }));
    const formResult = ev.target.modelValue;
    const { settings } = formResult;

    const result = { expand: {} };

    [
      ...ev.target.querySelectorAll(
        'sd-checkbox-group[name="settings"] > sd-checkbox'
      ),
    ].forEach((checkEl) => {
      let val = Boolean(
        settings.find((setting) => setting === checkEl.choiceValue)
      );

      let prop = result;
      if (checkEl.hasAttribute("expand")) {
        prop = result.expand;
      }
      prop[checkEl.choiceValue] = val;
    });

    syncTransformOptionsWithUI(result);
  }
}
customElements.define("settings-dialog", SettingsDialog);
