import * as prettier from "prettier/standalone";
import * as parserBabel from "prettier/plugins/babel";
import * as prettierPluginEstree from "prettier/plugins/estree";
import MagicString from "magic-string";
import { asyncWalk } from "estree-walker";
import { fs } from "style-dictionary/fs";
import { parseTransformOptions } from "./parseTransformOptions.js";
import { SD_FUNCTIONS_PATH, FUNCTIONS } from "../constants.js";
import { encodeContentsToURL } from "../utils/file-tree.js";
import { sdState } from "../style-dictionary.js";

export async function syncTransformOptionsWithUI(options) {
  const { ast, code } = await parseTransformOptions();
  const ms = new MagicString(code);
  const optionsAsCode = JSON.stringify(options);

  await asyncWalk(ast, {
    enter: async (node) => {
      if (node.type === "CallExpression") {
        // register(arg1, arg2)
        if (node.callee.name === "register" && node.arguments[0]?.name) {
          const firstArgLiteral = node.arguments[0].name; // value of first arg string literal, e.g. StyleDictionary
          ms.overwrite(
            node.start,
            node.end,
            `register(${firstArgLiteral}, ${optionsAsCode})`
          );
        }
      }
    },
  });

  const newCode = await prettier.format(ms.toString(), {
    parser: "babel",
    plugins: [parserBabel, prettierPluginEstree],
    singleQuote: true,
  });

  fs.writeFileSync(SD_FUNCTIONS_PATH, newCode);

  const configuratorAppEl = document.querySelector("configurator-element");
  await configuratorAppEl.updateComplete;
  configuratorAppEl.shadowRoot.querySelector("config-switcher").checkedChoice =
    FUNCTIONS;
  sdState.runStyleDictionary({ force: true });
  await encodeContentsToURL();
}
