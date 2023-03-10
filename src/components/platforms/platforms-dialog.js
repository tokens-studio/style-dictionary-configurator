import StyleDictionary from "browser-style-dictionary/browser.js";
import { html, LitElement } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { ref, createRef } from "lit/directives/ref.js";
import { Required } from "@lion/ui/form-core.js";
import { LionForm } from "@lion/ui/form.js";
import { TransformsValidator } from "../combobox/TransformsValidator.js";
import { codicon } from "../../icons/codicon-style.css.js";
import { sdState } from "../../style-dictionary.js";
import styles from "./platforms-dialog.css.js";
import PencilIcon from "../../assets/icons/pencil.svg";
import PlusIcon from "../../assets/icons/plus.svg";

import "../dialog/sd-dialog.js";
import "../dialog/sd-dialog-frame.js";
import "../combobox/sd-combobox.js";
import "../combobox/sd-option.js";
import "../combobox/sd-selection-display.js";
import "../input/sd-input.js";
import "../button/ts-button.js";
import "../button/ts-button-submit.js";

customElements.define("sd-form", LionForm);

class PlatformsDialog extends LitElement {
  static get properties() {
    return {
      _files: {
        state: true,
      },
      _transforms: {
        state: true,
      },
      _platformData: {
        state: true,
      },
      platform: {
        type: String,
        reflect: true,
      },
    };
  }

  static get styles() {
    return [codicon, styles];
  }

  constructor() {
    super();
    this._files = [];
    this._transforms = [];
    this.platform = "";
    this.dialogRef = createRef();
    this.comboTransformsRef = createRef();
    this.comboFormatsRef = createRef();
  }

  firstUpdated() {
    this.preventDialogCloseOnComboClose();
  }

  updated(changedProperties) {
    if (changedProperties.has("platform") && this.platform) {
      this.onPlatformChanged();
    }
  }

  render() {
    return html`
      <sd-dialog ${ref(this.dialogRef)}>
        ${this.platform
          ? html`<ts-button
              aria-label="Edit platform button"
              slot="invoker"
              variant="tertiary"
            >
              ${PencilIcon()}
            </ts-button>`
          : html`<ts-button slot="invoker" variant="secondary">
              ${PlusIcon()} Add platform
            </ts-button>`}
        <sd-dialog-frame
          class="dialog__frame"
          title=${this.platform ? "Change platform" : "Add a new platform"}
          has-close-button
          slot="content"
        >
          <div slot="content">${this.formTemplate()}</div>
        </sd-dialog-frame>
      </sd-dialog>
    `;
  }

  formTemplate() {
    return html`
      <sd-form class="platform-form" @submit="${this.submitForm}">
        <form>
          <sd-input
            name="name"
            label="Platform name*"
            placeholder="e.g. Android"
            .modelValue=${this.platform ? this.platform : ""}
            .validators=${[new Required()]}
          ></sd-input>
          <sd-input
            name="buildPath"
            label="Build path"
            placeholder="e.g. build/"
            help-text="Relative to root"
            .modelValue=${this._platformData
              ? this._platformData.buildPath
              : ""}
          ></sd-input>
          <sd-input
            name="prefix"
            label="Prefix"
            placeholder="e.g. sd"
            .modelValue=${this._platformData ? this._platformData.prefix : ""}
          ></sd-input>
          ${this.transformsSearchTemplate()} ${this.formatsSearchTemplate()}
          <ts-button-submit variant="primary">Save</ts-button-submit>
        </form>
      </sd-form>
    `;
  }

  transformsSearchTemplate() {
    return html`
      <sd-combobox
        ref=${ref(this.comboTransformsRef)}
        name="transforms"
        label="Transforms"
        placeholder="Type to search"
        help-text="One transform group is allowed, you can pick multiple standalone transforms"
        show-all-on-empty
        multiple-choice
        .modelValue=${this._transforms}
        .validators=${[new TransformsValidator()]}
      >
        <sd-selection-display slot="selection-display"></sd-selection-display>
        ${repeat(
          Object.keys(StyleDictionary.transformGroup)
            // put tokens-studio transformGroup first
            .sort((a, b) => {
              if (a === "tokens-studio") return -1;
              if (b === "tokens-studio") return 1;
              return 0;
            }),
          (transformGroup) => transformGroup,
          (transformGroup) => html`
            <sd-option
              .checked=${false}
              .choiceValue="${transformGroup} (group)"
              group
              >${transformGroup} (group)</sd-option
            >
          `
        )}
        ${repeat(
          Object.keys(StyleDictionary.transform)
            // put tokens-studio transforms first
            .sort((a, b) => {
              if (a.startsWith("ts/")) return -1;
              if (b.startsWith("ts/")) return 1;
              return 0;
            }),
          (transform) => transform,
          (transform) => html`
            <sd-option .checked=${false} .choiceValue="${transform}"
              >${transform}</sd-option
            >
          `
        )}
      </sd-combobox>
    `;
  }

  formatsSearchTemplate() {
    return html`
      <sd-combobox
        ref=${ref(this.comboFormatsRef)}
        name="formats"
        label="Formats*"
        placeholder="Type to search"
        help-text="Pick your formats, configure the filepath below in the result"
        show-all-on-empty
        multiple-choice
        .validators=${[new Required()]}
        .modelValue=${this._files.map((file) => file.format)}
        @model-value-changed=${this.onFormatsComboModelValueChanged}
      >
        <sd-selection-display slot="selection-display"></sd-selection-display>
        ${repeat(
          Object.keys(StyleDictionary.format),
          (format) => format,
          (format) => html`
            <sd-option .checked=${false} .choiceValue="${format}"
              >${format}</sd-option
            >
          `
        )}
      </sd-combobox>
      ${repeat(
        this._files,
        (file) => file.format,
        (file) => html`
          <sd-input
            name="format:${file.format}"
            label="${file.format} destination"
            help-text="Enter a filename for this format, e.g. 'variables.css'"
            .modelValue=${file.destination}
            .validators=${[new Required()]}
          ></sd-input>
        `
      )}
    `;
  }

  /**
   * When pressing ESC while inside a combobox, this closes the combobox.
   * However, that ESC keyup event also fires a "cancel" event on native <dialog> element
   * as well as bubbles up to the dialog contentNode.
   * Both of those things will lead to closing the dialog prematurely, so this
   * method prevents this from happening by intercepting those events.
   */
  async preventDialogCloseOnComboClose() {
    const dialogEl = this.dialogRef.value;
    await dialogEl.updateComplete;
    const comboTransformsEl = this.comboTransformsRef.value;
    const comboFormatsEl = this.comboFormatsRef.value;
    if (dialogEl._overlayCtrl?.content) {
      dialogEl._overlayCtrl.content.addEventListener("cancel", (ev) => {
        ev.preventDefault();
      });
      comboTransformsEl.addEventListener("keyup", this.comboCloseHandler);
      comboFormatsEl.addEventListener("keyup", this.comboCloseHandler);
    }
  }

  comboCloseHandler(ev) {
    if (ev.key === "Escape") {
      ev.stopPropagation();
    }
  }

  async onPlatformChanged() {
    await sdState.hasInitialized;
    this._platformData = sdState.config.platforms[this.platform];

    this._transforms = [
      ...(this._platformData?.transformGroup
        ? [`${this._platformData.transformGroup} (group)`]
        : []),
      ...(this._platformData?.transforms ? this._platformData.transforms : []),
    ];

    this._files = [
      ...(this._platformData?.files ? this._platformData.files : []),
    ];
  }

  async onFormatsComboModelValueChanged(ev) {
    if (!this.dialogRef.value.opened) {
      return;
    }

    const selectionDisplayNode = ev.target._selectionDisplayNode;
    if (selectionDisplayNode) {
      await selectionDisplayNode.updateComplete;
      const { _selectedElements } = selectionDisplayNode;
      const selectedFormats = _selectedElements.map((el) => el.choiceValue);
      const oldRemainingFiles = this._files.filter((file) =>
        selectedFormats.find((format) => format === file.format)
      );
      const newFiles = selectedFormats
        .filter((format) => !this._files.find((file) => format === file.format))
        .map((format) => ({
          format,
          destination: "",
        }));
      this._files = [...oldRemainingFiles, ...newFiles];
    }
  }

  submitForm(ev) {
    ev.preventDefault();

    // prevent form submission if there are validation errors
    if (ev.target.hasFeedbackFor.includes("error")) {
      return;
    }

    const formResult = ev.target.modelValue;
    const { buildPath, prefix, name, transforms } = formResult;

    let transformGroup;
    let standaloneTransforms = [];
    transforms.forEach((transform) => {
      if (transform.endsWith(" (group)")) {
        transformGroup = transform.replace(" (group)", "");
      } else {
        standaloneTransforms.push(transform);
      }
    });

    const files = Object.entries(formResult)
      .filter(([key]) => key.startsWith("format:"))
      .map(([format, destination]) => ({
        destination,
        format: format.replace("format:", ""),
      }));

    // TODO: consider not normalizing buildPath, as it means that users might face errors
    // with their buildPath once they eject from this configurator and run it locally.
    // remove trailing and leading slashes, add 1 final trailing slash
    let normalizedBuildPath = `${buildPath.replace(/^\/+|\/+$/g, "")}/`;
    // if path is only "/", remove it
    if (normalizedBuildPath === "/") normalizedBuildPath = "";

    const platform = {
      // add trailing slash
      buildPath: normalizedBuildPath,
      prefix,
      ...(transformGroup ? { transformGroup } : {}),
      ...(standaloneTransforms.length > 0
        ? { transforms: standaloneTransforms }
        : {}),
      files,
    };

    this.dispatchEvent(
      new CustomEvent("save-platform", { detail: { [name]: platform } })
    );
    // delete the "old" platform if the platform name was changed
    // to prevent making a copy with new name
    if (this.platform && this.platform !== name) {
      this.dispatchEvent(
        new CustomEvent("delete-platform", { detail: this.platform })
      );
    }
    ev.target.dispatchEvent(new Event("close-overlay", { bubbles: true }));
  }
}
customElements.define("platforms-dialog", PlatformsDialog);
