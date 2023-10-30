import { editorOutput, editorConfig } from "./monaco.js";

export function resizeMonacoLayout() {
  const minimumMonacoWidth = 650;
  const middlePreferredWidth = 550;
  const fileTreeWidth = 200;
  const borderLeftWidth = 1;
  const configuratorAppEl = document.querySelector("configurator-app");

  const sectionRightHeight =
    configuratorAppEl.shadowRoot.querySelector(".right").offsetHeight;

  const contentSectionWidth = configuratorAppEl.shadowRoot
    .querySelector(".middle")
    .parentElement.getBoundingClientRect().width;

  editorOutput.layout({
    width: Math.max(
      minimumMonacoWidth - fileTreeWidth,
      contentSectionWidth -
        middlePreferredWidth -
        fileTreeWidth -
        borderLeftWidth
    ),
    height: sectionRightHeight / 2,
  });

  editorConfig.layout({
    width: Math.max(
      minimumMonacoWidth,
      contentSectionWidth - middlePreferredWidth - borderLeftWidth
    ),
    height: sectionRightHeight / 2,
  });
}
