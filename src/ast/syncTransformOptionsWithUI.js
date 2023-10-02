import prettier from "prettier/esm/standalone.mjs";
import babel from "prettier/esm/parser-babel.mjs";
import MagicString from "magic-string";
import { asyncWalk } from "estree-walker";
import fs from "@bundled-es-modules/memfs";
import { parseTransformOptions } from "./parseTransformOptions.js";
import { SD_FUNCTIONS_PATH, FUNCTIONS } from "../constants.js";
import { encodeContentsToURL } from "../file-tree/file-tree-utils.js";
import { sdState } from "../style-dictionary.js";

export async function syncTransformOptionsWithUI(options) {
  const { ast, code } = await parseTransformOptions();
  const ms = new MagicString(code);
  const optionsAsCode = JSON.stringify(options);

  await asyncWalk(ast, {
    enter: async (node) => {
      if (node.type === "CallExpression") {
        // registerTransforms(arg1, arg2)
        if (
          node.callee.name === "registerTransforms" &&
          node.arguments[0]?.name
        ) {
          const firstArgLiteral = node.arguments[0].name; // value of first arg string literal, e.g. StyleDictionary
          ms.overwrite(
            node.start,
            node.end,
            `registerTransforms(${firstArgLiteral}, ${optionsAsCode})`
          );
        }
      }
    },
  });

  const newCode = prettier.format(ms.toString(), {
    parser: "babel",
    plugins: [babel],
    singleQuote: true,
  });

  fs.writeFileSync(SD_FUNCTIONS_PATH, newCode);
  document.querySelector("config-switcher").checkedChoice = FUNCTIONS;
  sdState.runStyleDictionary(true);
  await encodeContentsToURL();
}
