import { css } from "lit";

export default css`
  :host {
    display: inline-block;
    position: relative;
    box-sizing: border-box;
    background-color: var(--bgDefault);
    border-radius: 9999px;
    border: 1px solid transparent;
    margin: 4px;
    padding: var(--space2) var(--space4);
    line-height: 20px;
    font-size: 14px;
    cursor: default;
    user-select: none;
  }

  :host(:hover) {
    background-color: var(--bgSubtle);
  }

  :host([focused]) {
    border: 1px solid var(--accentDefault);
  }

  :host([checked]) {
    background-color: var(--accentBg);
  }

  :host([disabled]) {
    pointer-events: none;
    filter: brightness(0.6);
  }

  ::slotted(input) {
    position: absolute;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    overflow: hidden;
    white-space: nowrap;
    height: 1px;
    width: 1px;
  }

  ::slotted([slot="label"]) {
    color: var(--fgMuted);
  }

  :host(:hover) ::slotted([slot="label"]),
  :host([focused]) ::slotted([slot="label"]),
  :host([checked]) ::slotted([slot="label"]) {
    color: var(--fgDefault);
  }
`;
