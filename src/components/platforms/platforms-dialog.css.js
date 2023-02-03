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
    gap: var(--space4);
  }

  p {
    margin: 0;
  }

  .platform-form > *:not(:last-child) {
    margin-bottom: 0.5rem;
  }

  .dialog__frame {
    overflow-y: auto;
    max-height: 75vh;
    top: -5%;
  }
`;
