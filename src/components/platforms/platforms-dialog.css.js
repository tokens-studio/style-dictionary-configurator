import { css } from "lit-element";
export default css`
  .codicon-edit:before {
    content: "\\ea73";
  }
  .codicon-diff-added:before {
    content: "\\eadc";
  }

  form {
    display: flex;
    flex-direction: column;
    gap; var(--space3);
  }

  p {
    margin: 0;
  }

  .platform-form > *:not(:last-child) {
    margin-bottom: 0.5rem;
  }

  /** selection display lightdom styles */
  [slot="selection-display"] {
    display: block;
    font-size: 14px;
  }

  .combobox__selection {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25em;
  }

  .combobox__input {
    display: block;
  }

  .codicon-close {
    padding: 0;
  }

  .selection-chip {
    border-radius: 4px;
    background-color: #eee;
    padding: 6px;
    display: flex;
    align-items: center;
    gap: 0.5em;
  }

  .selection-chip--highlighted {
    background-color: #ccc;
  }

  * > ::slotted([slot="_textbox"]) {
    outline: none;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    border: none;
    border-bottom: 1px solid;
  }

  .error {
    border: 1px solid red;
  }

  form > * {
    margin-bottom: 10px;
  }

  .trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space2);
    border: 1px solid var(--buttonSecondaryBorderRest);
    border-radius: var(--radiiMedium);
    background: var(--buttonSecondaryBgRest);
    padding: var(--space4) var(--space5);
    font-weight: var(--fontWeightsSansMedium);
    color: var(--buttonSecondaryFg);
    cursor: pointer;
  }
  .trigger:hover {
    background: var(--buttonSecondaryBgHover);
  }

  .trigger-invisible {
    border: none;
    background: none;
    aspect-ratio: 1 / 1;
    padding: 0;
    height: 32px;
  }

  .form-control .input {
    background: red;
  }

  .input-group__input: {
    background: blue;
  }
`;
