import { css } from "lit-element";
export default css`
  button {
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

  :host([size="small"]) button {
    width: 28px;
    height: 28px;
  }

  button:hover {
    background-color: var(--bgSubtle);
  }

  button:focus {
    box-shadow: var(--shadowsFocus);
    outline: 0;
  }
`;
