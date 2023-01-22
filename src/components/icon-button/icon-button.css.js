import { css } from "lit-element";
export default css`
  ::slotted(button) {
    border: 0;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radiiSmall);
    background-color: transparent;
    cursor: pointer;
    color: var(--fgDefault);
  }

  :host([size="small"]) ::slotted(button) {
    width: 28px;
    height: 28px;
  }

  ::slotted(button):hover {
    background-color: var(--bgSubtle);
  }

  ::slotted(button):focus {
    box-shadow: var(--shadowsFocus);
    outline: 0;
  }
`;
