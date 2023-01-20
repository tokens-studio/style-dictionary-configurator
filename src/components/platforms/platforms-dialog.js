import StyleDictionary from "browser-style-dictionary/browser.js";
import { css, html, LitElement } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { ref, createRef } from "lit/directives/ref.js";
import { classMap } from "lit/directives/class-map.js";
import { Required } from "@lion/ui/form-core.js";
import { LionForm } from "@lion/ui/form.js";
import { TransformsValidator } from "../combobox/TransformsValidator.js";
import { codicon } from "../../icons/codicon-style.css.js";
import { sdState } from "../../style-dictionary.js";

import "../dialog/sd-dialog.js";
import "../dialog/sd-dialog-frame.js";
import "../combobox/sd-combobox.js";
import "../combobox/sd-option.js";
import "../combobox/sd-selection-display.js";
import "../input/sd-input.js";

customElements.define("sd-form", LionForm);

class PlatformsDialog extends LitElement {
  static get properties() {
    return {
      _files: {
        state: true,
      },
      _formats: {
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
    return [
      codicon,
      css`
        .codicon-edit:before {
          content: "\\ea73";
        }
        .codicon-diff-added:before {
          content: "\\eadc";
        }

        .dialog-frame {
          align-self: flex-start;
          margin-top: 100px;
        }

        p {
          margin: 0;
        }

        .platform-form > *:not(:last-child) {
          margin-bottom: 0.5rem;
        }

        /** selection display lightdom styles */
        [slot="selection-display"] {
          display: block;
          font-size: 14px;
        }

        .combobox__selection {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25em;
        }

        .combobox__input {
          display: block;
        }

        .codicon-close {
          padding: 0;
        }

        .selection-chip {
          border-radius: 4px;
          background-color: #eee;
          padding: 6px;
          display: flex;
          align-items: center;
          gap: 0.5em;
        }

        .selection-chip--highlighted {
          background-color: #ccc;
        }

        * > ::slotted([slot="_textbox"]) {
          outline: none;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          border: none;
          border-bottom: 1px solid;
        }

        .error {
          border: 1px solid red;
        }

        form > * {
          margin-bottom: 10px;
        }
      `,
    ];
  }

  constructor() {
    super();
    this._files = [];
    this._formats = [];
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
    const invokerBtnClasses = {
      codicon: true,
      "codicon-diff-added": !this.platform,
      "codicon-edit": this.platform,
    };

    return html`
      <sd-dialog ${ref(this.dialogRef)}>
        <button
          slot="invoker"
          class="${classMap(invokerBtnClasses)}"
          aria-label="add platform button"
        ></button>
        <sd-dialog-frame class="dialog-frame" has-close-button slot="content">
          <p slot="header">
            ${this.platform ? "Change" : "Add a new"} platform
          </p>
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
            .modelValue=${this.platform ? this.platform : ""}
            .validators=${[new Required()]}
          ></sd-input>
          <sd-input
            name="buildPath"
            label="Build path"
            help-text="Relative to root"
            .modelValue=${this._platformData
              ? this._platformData.buildPath
              : ""}
          ></sd-input>
          <sd-input
            name="prefix"
            label="Prefix"
            .modelValue=${this._platformData ? this._platformData.prefix : ""}
          ></sd-input>
          ${this.transformsSearchTemplate()} ${this.formatsSearchTemplate()}
          <button class="save-button">Save</button>
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
        help-text="One transform group is allowed, you can pick multiple standalone transforms"
        show-all-on-empty
        multiple-choice
        .modelValue=${this._transforms}
        @model-value-changed=${this.onComboModelValueChanged}
        .validators=${[new TransformsValidator()]}
      >
        <sd-selection-display slot="selection-display"></sd-selection-display>
        ${Object.keys(StyleDictionary.transformGroup)
          // put tokens-studio transform group ordered first
          .sort((a, b) => {
            if (a === "tokens-studio") return -1;
            if (b === "tokens-studio") return 1;
            return 0;
          })
          .map(
            (transformGroup) => html`
              <sd-option
                .checked=${false}
                .choiceValue="${transformGroup} (group)"
                group
                >${transformGroup} (group)</sd-option
              >
            `
          )}
        ${Object.keys(StyleDictionary.transform)
          // put tokens-studio transforms first
          .sort((a, b) => {
            if (a.startsWith("ts/")) return -1;
            if (b.startsWith("ts/")) return 1;
            return 0;
          })
          .map(
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
        help-text="Pick your formats, configure the filepath below in the result"
        show-all-on-empty
        multiple-choice
        .validators=${[new Required()]}
        .modelValue=${this._files.map((file) => file.format)}
        @model-value-changed=${this.onComboModelValueChanged}
      >
        <sd-selection-display slot="selection-display"></sd-selection-display>
        ${Object.keys(StyleDictionary.format).map(
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
    this._platformData = sdState._sd.platforms[this.platform];

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

  async onComboModelValueChanged(ev) {
    /** @type {'formats'|'transforms'} */
    const type = ev.target.getAttribute("name");
    const filesOrTransforms = type === "formats" ? "_files" : "_transforms";

    // When the selected options change, we need to sync it to
    // this._files or this._transforms respectively.
    const selectionDisplayNode = ev.target._selectionDisplayNode;
    if (selectionDisplayNode) {
      await selectionDisplayNode.updateComplete;
      const { _selectedElements } = selectionDisplayNode;
      const selectedChoices = _selectedElements.map((el) => el.choiceValue);

      // Any selected choice that's not currently
      // in filesOrTransforms means it's a new file/transform
      const newVals = selectedChoices
        .filter(
          (choice) =>
            !this[filesOrTransforms].find((file) => file.format === choice)
        )
        .map((newFormatOrTransform) => {
          if (type === "formats") {
            return { format: newFormatOrTransform, destination: "" }; // <- for _files
          } else {
            return newFormatOrTransform; // <- for _transforms
          }
        });

      // old values, but filter out the ones that
      // are not among the selected options anymore (deleted)
      const oldVals = this[filesOrTransforms].filter((fileOrTransform) =>
        selectedChoices.find((choice) => {
          const oldFormatOrTransform =
            type === "formats" ? fileOrTransform.format : fileOrTransform;
          return oldFormatOrTransform === choice;
        })
      );

      this[filesOrTransforms] = [...oldVals, ...newVals];
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
    ev.target.dispatchEvent(new Event("close-overlay", { bubbles: true }));
  }
}
customElements.define("platforms-dialog", PlatformsDialog);
