import { LionButtonSubmit } from "@lion/ui/button.js";
import { ButtonMixin } from "./ButtonMixin.js";

export class ButtonSubmit extends ButtonMixin(LionButtonSubmit) {}

customElements.define("ts-button-submit", ButtonSubmit);
