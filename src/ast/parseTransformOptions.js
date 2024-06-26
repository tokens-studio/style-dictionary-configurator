import { parse } from "acorn";
import { asyncWalk } from "estree-walker";
import { fs } from "style-dictionary/fs";
import { SD_FUNCTIONS_PATH } from "../constants";

export async function parseTransformOptions() {
  const functionsFile = fs.readFileSync(SD_FUNCTIONS_PATH, "utf-8");
  const ast = parse(functionsFile, {
    allowImportExportEverywhere: true,
    ecmaVersion: "latest",
  });
  let currentOptions = {};
  await asyncWalk(ast, {
    enter: (node) => {
      if (node.type === "CallExpression") {
        // register(arg1, arg2)
        if (node.callee.name === "register") {
          // arg2 which are the options
          if (
            node.arguments.length === 2 &&
            node.arguments[1].type === "ObjectExpression"
          ) {
            const getValue = (prop) => {
              let value;
              switch (prop.value.type) {
                case "Literal":
                  value = prop.value.value;
                  break;
                case "ObjectExpression":
                  value = Object.fromEntries(
                    prop.value.properties.map((subProp) => [
                      subProp.key.name,
                      getValue(subProp),
                    ])
                  );

                  break;
                case "FunctionExpression":
                case "ArrowFunctionExpression":
                default:
                  value = "__function__"; // special case --> dont handle functions
                  break;
              }
              return value;
            };

            // adjust
            currentOptions = Object.fromEntries(
              node.arguments[1].properties.map((prop) => {
                return [prop.key.name, getValue(prop)];
              })
            );
          }
        }
      }
    },
  });
  return { code: functionsFile, ast, currentOptions };
}
