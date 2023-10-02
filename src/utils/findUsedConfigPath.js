import path from "@bundled-es-modules/path-browserify";
import fs from "@bundled-es-modules/memfs";

export const findUsedConfigPath = () => {
  // supported config paths, prioritized in this order
  const configPaths = [
    "config.js",
    "sd.config.js",
    "config.mjs",
    "sd.config.mjs",
    "config.json",
    "sd.config.json",
  ].map((p) => path.resolve(p));

  return configPaths.find((cfgPath) => fs.existsSync(cfgPath));
};
