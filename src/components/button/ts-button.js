import { LionButton } from "@lion/ui/button.js";
import { ButtonMixin } from "./ButtonMixin.js";

export class Button extends ButtonMixin(LionButton) {}

customElements.define("ts-button", Button);
