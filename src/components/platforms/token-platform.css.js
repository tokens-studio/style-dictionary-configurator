import { css } from "lit-element";
export default css`
  p {
    margin: 0;
  }

  h2 {
    font-size: var(--fontSizesSmall);
    font-weight: var(--fontWeightsSansMedium);
    color: var(--fgSubtle);
    margin: 0;
    margin-bottom: var(--space3);
  }

  h3 {
    font-size: var(--fontSizesBasel);
    font-weight: var(--fontWeightsSansMedium);
    color: var(--fgSubtle);
    margin: 0;
  }

  h4 {
    font-size: var(--fontSizesSmall);
    font-weight: var(--fontWeightsSansMedium);
    margin: 0;
  }

  .platforms {
    display: flex;
    flex-direction: column;
    gap: var(--space3);
  }

  .platforms-container {
    display: flex;
    flex-direction: column;
    gap: var(--space3);
    background: var(--bgDefault);
  }

  .platform {
    border: 1px solid var(--borderMuted);
    border-radius: var(--radiiMedium);
  }

  .platform__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--borderMuted);
    padding: var(--space1) var(--space5);
    padding-right: var(--space1);
  }

  .platform__content {
    padding: var(--space5);
    display: flex;
    flex-direction: column;
    gap: var(--space6);
  }

  .platform__title {
    font-size: var(--fontSizesBase);
    color: var(--fgDefault);
  }

  .text-small {
    font-size: var(--fontSizesXsmall);
    color: var(--fgSubtle);
  }

  .config-group {
    display: flex;
    flex-direction: column;
    gap: var(--space4);
  }

  .transform {
    display: flex;
    flex-direction: column;
    gap: var(--space2);
  }

  .formats-container {
    display: flex;
    flex-direction: column;
    gap: var(--space5);
  }

  .format {
    display: flex;
    flex-direction: row;
    gap: var(--space3);
  }

  .format-file {
    display: flex;
    flex-direction: row;
    gap: var(--space2);
    font-family: monospace;
    font-size: var(--fontSizesXsmall);
  }
`;
