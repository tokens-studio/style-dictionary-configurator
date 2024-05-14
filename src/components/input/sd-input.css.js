import { css } from "lit";
export default css`
  ::slotted([slot="help-text"]),
  ::slotted([slot="label"]) {
    color: var(--fgDefault);
  }

  ::slotted([slot="label"]) {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: var(--space2);
    font-weight: var(--fontWeightsSansMedium);
    font-size: var(--fontSizesSmall);
  }

  ::slotted([slot="input"]) {
    font-weight: var(--fontWeightsSansRegular);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radiiSmall);
    padding: 0 var(--space4);
    height: 32px;
    font-size: var(--fontSizesSmall);
    color: var(--fgDefault);
    line-height: 1;
    background-color: var(--inputBg);
    border: 1px solid var(--borderSubtle);
  }

  ::slotted([slot="input"]:focus-visible) {
    box-shadow: var(--shadowsFocus);
    outline: none;
  }

  ::slotted([slot="feedback"][type="error"]) {
    font-size: var(--fontSizesSmall);
    color: var(--dangerFg);
  }
`;
