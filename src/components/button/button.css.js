import { css } from "lit-element";
export default css`
  :host {
    width: max-content;
    color: var(--fgDefault);
    background: none;
    padding: 0;
  }

  :host(:hover) {
    background: none;
  }

  .button-content {
    border-width: 1px;
    border-style: solid;
    border-color: transparent;
    display: inline-flex;
    align-items: center;
    gap: var(--space3);
    border-radius: var(--radiiMedium);
    line-height: 20px;
    font-weight: var(--fontWeightsSansMedium);
    position: relative;
    box-shadow: var(--shadowsSmall);
    cursor: pointer;

    /* Move to size later on */
    padding: var(--space3) var(--space4);
    font-size: var(--fontSizesSmall);
  }

  :host([variant="primary"]) .button-content {
    background: var(--accentEmphasis);
    color: var(--buttonSecondaryFg);
  }

  :host([variant="primary"]:hover) .button-content {
    background-color: var(--accentMuted);
  }

  :host([variant="secondary"]) .button-content {
    background: var(--buttonSecondaryBgRest);
    color: var(--buttonSecondaryFg);
    border-color: var(--buttonSecondaryBorderRest);
  }

  :host([variant="secondary"]:hover) .button-content,
  :host([variant="tertiary"]:hover) .button-content {
    background-color: var(--buttonSecondaryBgHover);
  }

  :host([variant="tertiary"]) .button-content {
    box-shadow: none;
  }

  :host(:focus) {
    box-shadow: var(--shadowsFocus);
    outline: 0;
  }

  :host([no-padding]) .button-content {
    padding: 0;
  }
`;
