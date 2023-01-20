import { css } from "lit-element";
export default css`
  label {
    display: flex;
    flex-direction: column;
    color: var(--fgDefault);
    width: 100%;
    gap: var(--space2);
    font-weight: var(--fontWeightsSansMedium);
    font-size: var(--fontSizesSmall);
  }

  input {
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
    border: 1px solid var(--inputBorderRest);
  }

  input:focus-visible {
    box-shadow: var(--shadowsFocus);
    outline: none;
  }
`;
