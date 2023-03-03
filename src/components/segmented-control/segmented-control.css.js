import { css } from "lit";

export default css`
  .control-choice-container {
    display: inline-block;
    border: 1px solid var(--accentBg);
    border-radius: 18px;
  }

  :host([disabled]) ::slotted([slot="label"]) {
    color: var(--fgSubtle);
  }
`;
