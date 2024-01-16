import { TextReader, ZipWriter, BlobWriter } from "@zip.js/zip.js";
import fs from "@bundled-es-modules/memfs";
import { parse } from "acorn";
import { asyncWalk } from "estree-walker";
import prettier from "prettier/esm/standalone.mjs";
import babel from "prettier/esm/parser-babel.mjs";
import { sdState } from "./style-dictionary.js";
import { SD_CONFIG_PATH, SD_FUNCTIONS_PATH } from "./constants.js";
import { getInputFiles } from "./utils/file-tree.js";
import { snackbar } from "./components/snackbar/SnackbarManager.js";

export async function setupEjectBtnHandler() {
  const btnv3 = document.getElementById("eject-btn-v3");
  const btnv4 = document.getElementById("eject-btn-v4");
  if (btnv3) {
    btnv3.addEventListener("click", ejectHandler);
  }
  if (btnv4) {
    btnv4.addEventListener("click", ejectHandler);
  }
}

async function analyzeDependencies(code) {
  let dependencies = [];
  const ast = parse(code, {
    allowImportExportEverywhere: true,
    ecmaVersion: "latest",
  });
  await asyncWalk(ast, {
    enter: async (node) => {
      if (node.type === "ImportDeclaration") {
        const source = node.source.value;
        dependencies.push({
          source: source,
          specifiers: node.specifiers.map((spec) => ({
            name: spec.local.name,
            default: spec.imported === undefined,
          })),
          package: source
            .split("/")
            .slice(0, source.startsWith("@") ? 2 : 1)
            .join("/"),
        });
      }
    },
  });
  return dependencies;
}

function getImportsStrMap(dependencies, hasThemes) {
  // if there's theming, we will import permutateThemes, so add to dependencies
  if (hasThemes) {
    const sdTransformsPkgName = "@tokens-studio/sd-transforms";
    const foundSdTransforms = dependencies.find(
      (dep) => dep.package === sdTransformsPkgName
    );
    const permutateSpecifier = {
      name: "permutateThemes",
      default: false,
    };
    if (foundSdTransforms) {
      foundSdTransforms.specifiers.push(permutateSpecifier);
    } else {
      dependencies.push({
        source: sdTransformsPkgName,
        package: sdTransformsPkgName,
        specifiers: [permutateSpecifier],
      });
    }
  }

  const importsStrMap = new Map();

  // convert our dependencies array to a ESM imports string
  dependencies.forEach((dep) => {
    importsStrMap.set(dep.source, {
      namedImportsStr: dep.specifiers
        .filter((spec) => !spec.default)
        .reduce((acc, curr) => `${acc}${curr.name}, `, "")
        .trim()
        .replace(/,$/g, ""),
      defaultImportStr: dep.specifiers.find((spec) => spec.default)?.name,
    });
  });
  return importsStrMap;
}

function getDepsESMString(dependencies, hasThemes) {
  const importsStrMap = getImportsStrMap(dependencies, hasThemes);

  return Array.from(importsStrMap)
    .map(([source, data]) => {
      let str = "import ";
      const { defaultImportStr, namedImportsStr } = data;
      if (defaultImportStr) {
        str += defaultImportStr;
        if (namedImportsStr) {
          str += ", ";
        }
      }

      if (namedImportsStr) {
        str += `{ ${namedImportsStr} }`;
      }
      str += ` from '${source}';`;

      return str;
    })
    .join("\n");
}

function getDepsCJSString(dependencies, hasThemes) {
  const importsStrMap = getImportsStrMap(dependencies, hasThemes);
  // if there's theming, we will import permutateThemes, so add to dependencies

  return Array.from(importsStrMap)
    .map(([source, data]) => {
      let str = "const ";
      const { defaultImportStr, namedImportsStr } = data;
      if (defaultImportStr) {
        str += defaultImportStr;
      } else {
        str += `{ ${namedImportsStr} }`;
      }
      str += ` = require('${source}');`;

      if (defaultImportStr && namedImportsStr) {
        str += `\nconst { ${namedImportsStr} } = ${defaultImportStr};`;
      }

      return str;
    })
    .join("\n");
}

// replace %theme% placeholder with ${name}
// handle "" to become ``, otherwise ${} doesn't work
function handleThemePlaceholder(str) {
  const reg = /(:\s*?)"(.*)%theme%(.*)"/g;

  return str.replace(reg, (match, colonPlusSpace, w1, w2) => {
    return `${colonPlusSpace}\`${w1}\${name}${w2}\``;
  });
}

async function ejectHandler(ev) {
  const sdVersion = ev.target.getAttribute("id").split("eject-btn-")[1];
  ev.target.dispatchEvent(new Event("close-overlay", { bubbles: true }));

  const zipWriter = new ZipWriter(new BlobWriter("application/zip"));
  const inputFiles = await getInputFiles();
  await Promise.all(
    inputFiles
      .filter((file) => ![SD_CONFIG_PATH, SD_FUNCTIONS_PATH].includes(file))
      .map((file) =>
        zipWriter.add(file, new TextReader(fs.readFileSync(file, "utf-8")))
      )
  );

  const { themes, config } = sdState;
  const hasThemes = Object.keys(themes).length > 0;
  const functionsContent = fs.readFileSync(SD_FUNCTIONS_PATH, "utf-8");
  const dependencies = await analyzeDependencies(functionsContent);

  // regex that covers imports
  const reg = /import\s*?{?\s*?.*?\s*?}?\s*?from\s*['"](?<source>.*)['"];?/g;
  // we will put dependencies in as CJS later..
  const functionsWithoutImports = functionsContent.replace(reg, "");

  let newFileContent;
  const sdInitStr =
    sdVersion === "v3" ? "StyleDictionary.extend" : "new StyleDictionary";
  if (hasThemes) {
    const { platforms } = config;
    newFileContent = `${
      sdVersion === "v3"
        ? "const { readFileSync } = require('node:fs');"
        : "import { readFileSync } from 'node:fs';"
    };
${
  sdVersion === "v3"
    ? getDepsCJSString(dependencies, hasThemes)
    : getDepsESMString(dependencies, hasThemes)
}

${functionsWithoutImports.trim()}

const $themes = JSON.parse(readFileSync('$themes.json', 'utf-8'));
const themes = permutateThemes($themes, { seperator: '_' });
const configs = Object.entries(themes).map(([name, tokensets]) => ({
  source: tokensets.map(tokenset => \`\${tokenset}.json\`),
  platforms: ${handleThemePlaceholder(JSON.stringify(platforms, null, 2))}
}));

for (const cfg of configs) {
  const sd = ${sdInitStr}(cfg);
  // optionally, cleanup files first..
  ${sdVersion === "v4" ? "await " : ""}sd.cleanAllPlatforms();
  ${sdVersion === "v4" ? "await " : ""}sd.buildAllPlatforms();
}
`;
  } else {
    newFileContent = `${
      sdVersion === "v3"
        ? getDepsCJSString(dependencies, hasThemes)
        : getDepsESMString(dependencies, hasThemes)
    }

${functionsWithoutImports.trim()}

const sd = ${sdInitStr}(${handleThemePlaceholder(
      JSON.stringify(config, null, 2)
    )});
// optionally, cleanup files first..
${sdVersion === "v4" ? "await " : ""}sd.cleanAllPlatforms(); 
${sdVersion === "v4" ? "await " : ""}sd.buildAllPlatforms();
`;
  }

  await zipWriter.add(
    `build-tokens.${sdVersion === "v3" ? "c" : "m"}js`,
    new TextReader(
      prettier.format(newFileContent, {
        parser: "babel",
        plugins: [babel],
        singleQuote: true,
      })
    )
  );

  await zipWriter.add(
    "instructions.md",
    new TextReader(`# Install Dependencies

Install your dependencies with [NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

\`\`\`sh
npm init -y && npm install ${dependencies
      .map((dep) => {
        if (dep.package === "style-dictionary") {
          return sdVersion === "v3"
            ? `${dep.package}@latest`
            : `${dep.package}@prerelease`;
        }
        return dep.package;
      })
      .join(" ")}
\`\`\`

Then run

\`\`\`sh
node build-tokens.${sdVersion === "v3" ? "c" : "m"}js
\`\`\`
`)
  );

  // Close zip and make into URL
  const dataURI = await zipWriter.close();
  const url = URL.createObjectURL(dataURI);

  // Auto-download the ZIP through anchor
  const anchor = document.createElement("a");
  anchor.href = url;
  const today = new Date();
  anchor.download = `sd-eject-${today.getFullYear()}-${today.getMonth() + 1}-${(
    "0" + today.getDate()
  ).slice(-2)}.zip`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  snackbar.show(
    `You can now extract the .zip that you received, make sure to follow the instructions from the instructions.md file and voila! 🎉`,
    { status: "success" }
  );
}
