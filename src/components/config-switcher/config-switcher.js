import { html, css, LitElement } from "lit";
import fs from "@bundled-es-modules/memfs";
import { CONFIG, FUNCTIONS, SD_FUNCTIONS_PATH } from "../../constants.js";
import { ensureMonacoIsLoaded, editorConfig } from "../../monaco/monaco.js";
import { switchToFile } from "../../utils/file-tree.js";
import { findUsedConfigPath } from "../../utils/findUsedConfigPath.js";
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
    this.init();
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

  init() {
    this.checkedChoice = CONFIG;
    if (!fs.existsSync(SD_FUNCTIONS_PATH)) {
      fs.writeFileSync(
        SD_FUNCTIONS_PATH,
        `import StyleDictionary from 'style-dictionary';
import { registerTransforms } from '@tokens-studio/sd-transforms';

// sd-transforms, 2nd parameter for options can be added
// See docs: https://github.com/tokens-studio/sd-transforms
registerTransforms(StyleDictionary);

// example value transform, which just returns the token as is
StyleDictionary.registerTransform({
  type: "value",
  name: "myCustomTransform",
  matcher: (token) => {},
  transformer: (token) => {
    return token; // <-- transform as needed
  }
})

// format helpers from style-dictionary
const { fileHeader, formattedVariables } = StyleDictionary.formatHelpers;

// example css format
StyleDictionary.registerFormat({
  name: 'myCustomFormat',
  formatter: function({dictionary, file, options}) {
    const { outputReferences } = options;
    return \`\${fileHeader({file})}:root {
\${formattedVariables({format: 'css', dictionary, outputReferences})}
}\`;
  }
});\n`
      );
    }
    this.addEventListener("checked-changed", async (ev) => {
      const val = ev.target.checkedChoice;
      await ensureMonacoIsLoaded();
      if (val === FUNCTIONS) {
        // switch to register sd transforms
        switchToFile(SD_FUNCTIONS_PATH, editorConfig);
      } else {
        // switch to config
        switchToFile(findUsedConfigPath(), editorConfig);
      }
    });
  }
}
customElements.define("config-switcher", ConfigSwitcher);
