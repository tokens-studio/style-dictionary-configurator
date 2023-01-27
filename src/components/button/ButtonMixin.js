import { dedupeMixin } from "@open-wc/dedupe-mixin";
import styles from "./button.css.js";

export const ButtonMixin = dedupeMixin(
  (superclass) =>
    class extends superclass {
      static styles = styles;

      static get properties() {
        return {
          loading: {
            type: Boolean,
            reflect: true,
          },
          // "primary" | "secondary" | "tertiary"
          variant: {
            type: String,
            reflect: true,
          },
          // "small" | "medium" | "large"
          size: {
            type: String,
            reflect: true,
          },
        };
      }

      constructor() {
        super();
        this.variant = "primary";
      }
    }
);
