import { editorOutput, editorConfig } from "./monaco.js";

export function resizeMonacoLayout() {
  const platformsUIWidth = 600;
  const minimumMonacoWidth = 500;
  const fileTreeWidth = 200;

  const viewportWidth = Math.max(
    document.documentElement.clientWidth || 0,
    window.innerWidth || 0
  );
  // height is 50% (but using viewport height / 2 because it needs absolute numbers)
  const viewportHeight = Math.max(
    document.documentElement.clientHeight || 0,
    window.innerHeight || 0
  );

  editorOutput.layout({
    width: Math.max(
      minimumMonacoWidth - fileTreeWidth,
      viewportWidth - platformsUIWidth - fileTreeWidth
    ),
    height: viewportHeight / 2 + 1,
  });
  editorConfig.layout({
    width: Math.max(minimumMonacoWidth, viewportWidth - platformsUIWidth),
    height: viewportHeight / 2 + 1,
  });
}
