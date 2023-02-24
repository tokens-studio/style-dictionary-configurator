import { css } from "lit";

const trackPadding = -4;
const thumbDiameter = 20;
const thumbShadow = 6;

export default css`
  :host {
    width: auto;
    height: auto;
  }

  .btn {
    height: auto;
  }

  .switch-button__track {
    border-radius: 9999px;
    height: calc(${thumbDiameter}px + 2 * ${trackPadding}px);
    width: calc(2.1 * ${thumbDiameter}px + 2 * ${trackPadding}px);
    background-color: var(--fgSubtle);
    transition: background-color 0.3s ease-in-out;
  }

  .switch-button__thumb {
    border-radius: 9999px;
    width: ${thumbDiameter}px;
    height: ${thumbDiameter}px;
    left: ${trackPadding}px;
    top: 50%;
    transform: translateY(-50%);
    background-color: var(--fgDefault);
    outline: none;
    transition: left 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
  }

  :host([checked]) .switch-button__thumb {
    left: calc(100% - ${thumbDiameter}px - ${trackPadding}px);
  }

  :host([checked]) .switch-button__track {
    background-color: var(--accentDefault);
  }

  :host(:hover:not([disabled])) .switch-button__thumb {
    box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.2);
  }

  :host(:focus:not([disabled])) .switch-button__thumb {
    outline: none;
    box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.35);
  }

  :host([checked]:hover:not([disabled])) .switch-button__thumb,
  :host([checked]:focus:not([disabled])) .switch-button__thumb {
    box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.5);
  }

  :host([disabled]) .switch-button__thumb {
    background-color: var(--fgMuted);
  }

  :host([disabled]) .switch-button__track {
    background-color: var(--fgMuted);
  }

  :host([disabled][checked]) .switch-button__track {
    background-color: var(--fgSubtle);
  }
`;
