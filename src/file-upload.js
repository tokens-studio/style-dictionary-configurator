import { BlobReader, TextWriter, ZipReader } from "@zip.js/zip.js";
import { replaceSource } from "./file-tree/file-tree-utils.js";

export async function setupUploadBtnHandler() {
  const btn = document.getElementById("upload-tokens-btn");
  const fileInput = document.getElementById("upload-tokens-input");
  btn.addEventListener("click", () => {
    fileInput.dispatchEvent(new MouseEvent("click"));
  });
  fileInput.addEventListener("change", async (ev) => {
    const blob = ev.target.files[0];

    let files;
    if (blob.type.includes("zip")) {
      const zipReader = new ZipReader(new BlobReader(blob));
      const entries = await zipReader.getEntries({ filenameEncoding: "utf-8" });
      files = Object.fromEntries(
        await Promise.all(
          entries.map(
            (entry) =>
              new Promise(async (resolve) => {
                const fileContents = await entry.getData(
                  new TextWriter("utf-8")
                );
                resolve([entry.filename, fileContents]);
              })
          )
        )
      );
    } else {
      const reader = new FileReader(); // no arguments
      reader.readAsText(blob);
      const readPromise = new Promise((resolve) => {
        reader.addEventListener("load", () => {
          resolve(reader.result);
        });
      });
      const fileContent = await readPromise;
      files = { [blob.name]: fileContent };
    }
    ev.target.value = "";
    replaceSource(files);
  });
}