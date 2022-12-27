import { LionDialog } from "@lion/ui/dialog.js";

class SdDialog extends LionDialog {
  _defineOverlayConfig() {
    return {
      ...super._defineOverlayConfig(),
      hidesOnOutsideClick: true,
    };
  }
}

customElements.define("sd-dialog", SdDialog);
