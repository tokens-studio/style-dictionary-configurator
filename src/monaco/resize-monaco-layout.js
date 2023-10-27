import { editorOutput, editorConfig } from "./monaco.js";

export function resizeMonacoLayout() {
  const minimumMonacoWidth = 650;
  const fileTreeWidth = 200;
  const borderLeftWidth = 1;

  const sectionRightHeight = document.querySelector(".right").offsetHeight;
  const sectionMiddleWidth = document.querySelector(".middle").offsetWidth;

  const mainSectionWidth = document
    .querySelector(".middle")
    .parentElement.getBoundingClientRect().width;

  editorOutput.layout({
    width: Math.max(
      minimumMonacoWidth - fileTreeWidth,
      mainSectionWidth - sectionMiddleWidth - fileTreeWidth - borderLeftWidth
    ),
    height: sectionRightHeight / 2,
  });

  editorConfig.layout({
    width: Math.max(
      minimumMonacoWidth,
      mainSectionWidth - sectionMiddleWidth - borderLeftWidth
    ),
    height: sectionRightHeight / 2,
  });
}
