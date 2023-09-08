import { nebu } from "nebu";
import * as prettier from "prettier/standalone";
import * as babel from "prettier/parser-babel";
import fs from "fs";
import { parseTransformOptions } from "./parseTransformOptions.js";
import { SD_FUNCTIONS_PATH, FUNCTIONS } from "../constants.js";
import { encodeContentsToURL } from "../file-tree/file-tree-utils.js";
import { sdState } from "../style-dictionary.js";

export async function syncTransformOptionsWithUI(options) {
  const { ast, code } = parseTransformOptions();

  const optionsAsCode = JSON.stringify(options);

  const { js } = nebu.process(code, {
    ast,
    plugins: [
      {
        CallExpression(node) {
          // registerTransforms(arg1, arg2)
          if (
            node.callee.name === "registerTransforms" &&
            node.arguments[0]?.n?.name
          ) {
            const firstArgLiteral = node.arguments[0].n.name; // value of first arg string literal, e.g. StyleDictionary
            node.replace(
              `registerTransforms(${firstArgLiteral}, ${optionsAsCode})`
            );
          }
        },
      },
    ],
  });
  const newCode = prettier.format(js, {
    parser: "babel",
    plugins: [babel],
    singleQuote: true,
  });
  fs.writeFileSync(SD_FUNCTIONS_PATH, newCode);
  document.querySelector("config-switcher").checkedChoice = FUNCTIONS;
  sdState.runStyleDictionary(true);
  await encodeContentsToURL();
}
