const de = require('./translations/de.json');
const en = require('./translations/en.json');

const i18n = {
  translations: {
    en,
    de,
  },
  defaultLang: 'en',
  useBrowserDefault: true,
};

module.exports = i18n;
