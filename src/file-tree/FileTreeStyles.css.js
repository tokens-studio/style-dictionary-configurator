import { css } from "lit";

export default css`
  :host {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    background-color: var(--bgDefault);
    position: relative;
  }

  .codicon[class*="codicon-"] {
    font: normal normal normal 16px/1 codicon;
    background-color: transparent;
    border: none;
    cursor: pointer;
  }

  .codicon-clear-all:before {
    content: "\\eabf";
  }
  .codicon-cloud-download:before {
    content: "\\eac2";
  }
  .codicon-edit:before {
    content: "\\ea73";
  }
  .codicon-new-file:before {
    content: "\\ea7f";
  }
  .codicon-new-folder:before {
    content: "\\ea80";
  }
  .codicon-play:before {
    content: "\\eb2c";
  }
  .codicon-trash:before {
    content: "\\ea81";
  }

  #file-list {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 200px;
    color: var(--fgDefault);
    overflow-y: auto;
  }

  .file,
  .folder {
    display: inline-block;
    width: max-content;
  }

  .folder {
    padding: 0.25em 0em;
  }

  .file {
    display: flex;
    position: relative;
    align-items: center;
    margin-left: 1em;
  }

  .file > span {
    white-space: nowrap;
  }

  #file-list > details {
    margin-bottom: 0.5em;
  }

  details {
    padding-left: 0.75em;
  }

  summary {
    padding-left: 0.25em;
  }

  .row {
    cursor: pointer;
    padding-right: 1.25rem;
  }

  img {
    width: 18px;
    padding: 5px;
    display: block;
  }

  .file::after {
    content: "●";
    position: absolute;
    color: transparent;
    right: 0.375rem;
  }

  .row:hover {
    background-color: #0b1117;
  }

  .file[checked] {
    background-color: #1c2633;
  }

  .file[unsaved]::after {
    color: white;
  }

  .folder-row[checked] {
    background-color: #1c2633;
  }

  .new-file-input {
    margin-left: 1.5em;
    width: calc(100% - 3em);
    margin-right: 2em;
  }

  .new {
    display: flex;
    justify-content: flex-end;
    position: sticky;
    top: 0;
    margin-bottom: var(--space1);
    background-color: var(--bgSubtle);
    border-top-left-radius: var(--radiiMedium);
  }

  .new > .codicon,
  .clear > .codicon {
    padding: 0.5em;
    background-color: transparent;
    color: white;
    border: none;
    cursor: pointer;
  }

  .new > .codicon:hover,
  .clear > .codicon:hover {
    background-color: #0b1117;
  }

  .codicon-play {
    flex-grow: 1;
  }

  .loading-cue {
    position: relative;
    height: 3px;
    margin-bottom: 6px;
    overflow: hidden;
  }

  .loading-cue-overlay {
    position: absolute;
    height: 3px;
    width: 50px;
    left: -50px;
    background-color: #008dcb;
  }

  .loading-cue-overlay--slide {
    animation: slidethrough 500ms ease-in;
  }

  @keyframes slidethrough {
    from {
      left: -50px;
      width: 50px;
    }
    to {
      left: 100%;
      width: 500px;
    }
  }

  .input-files {
    flex-grow: 1;
    overflow-x: auto;
  }

  .output-files {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }

  .output-files > p {
    padding-top: 0.5rem;
    margin: 1.5rem 0 0.5rem 0;
    text-align: center;
    border-top: 1px solid #1c2633;
  }

  .flex-spacer {
    flex-grow: 1;
  }

  .clear {
    width: 100%;
    position: sticky;
    bottom: 0;
    display: flex;
    justify-content: center;
    overflow: hidden;
    border-bottom-left-radius: var(--border-radius-editor);
  }

  .clear > .codicon {
    width: 100%;
    background-color: #050608;
  }
`;
