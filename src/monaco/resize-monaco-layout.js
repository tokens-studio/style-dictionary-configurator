import { editorOutput, editorConfig } from "./monaco.js";

export function resizeMonacoLayout() {
  const minimumMonacoWidth = 650;
  const fileTreeWidth = 200;
  const borderLeftWidth = 1;

  const sectionRightHeight = document.querySelector(".right").offsetHeight;
  const sectionMiddleWidth = document.querySelector(".middle").offsetWidth;

  const viewportWidth = Math.max(
    document.documentElement.clientWidth || 0,
    window.innerWidth || 0
  );

  editorOutput.layout({
    width: Math.max(
      minimumMonacoWidth - fileTreeWidth,
      viewportWidth - sectionMiddleWidth - fileTreeWidth - borderLeftWidth
    ),
    height: sectionRightHeight / 2,
  });

  editorConfig.layout({
    width: Math.max(
      minimumMonacoWidth,
      viewportWidth - sectionMiddleWidth - borderLeftWidth
    ),
    height: sectionRightHeight / 2,
  });
}
