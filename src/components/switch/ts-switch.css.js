import { css } from "lit";

export default css`
  :host {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  ::slotted([slot="label"]) {
    padding-right: 1rem;
  }

  .input-group__container > .input-group__input ::slotted(.form-control) {
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
    border-radius: 9999px !important;
  }

  .input-group__container > .input-group__input ::slotted(.form-control:focus) {
    box-shadow: none !important;
  }
`;
