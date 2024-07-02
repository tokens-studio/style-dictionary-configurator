# Style Dictionary Configurator

This repository contains the style-dictionary configurator.

See projects for more info on status.

> This project was started from a [Style Dictionary Playground](style-dictionary-play.dev) fork

## Usage

Part of the application is a reusable Web Component that can be consumed in other contexts.

> For Monaco to work properly, we have to render it to LightDOM, as the consumer you are responsible
> for slotting in the monaco container divs with 100% height, we'll do the rest!

```js
// Custom Element definition, optionally you can also do: 
// import { ConfiguratorElement } from '@tokens-studio/configurator';
// to register it under a different custom element tag name.
import '@tokens-studio/configurator';
```

```html
<configurator-element>
  <div
    style="height: 100%"
    slot="monaco-config"
  ></div>
  <div
    style="height: 100%"
    slot="monaco-output"
  ></div>
</configurator-element>
```

You'll also need to ensure that WASM bindings are supported in whatever dev server you use. For Vite for example, you will need:

```js
optimizeDeps: {
  exclude: ['@rollup/browser'],
}
```

### Attributes

```html
<configurator-element prevent-init></configurator-element>
```

Allow `prevent-init` attribute to **not** initialize the configurator-element. Users can call `configuratorEl.init()` themselves e.g. after initializing the source files with the `replaceSource` utility, since this utility requires the `configurator-element` definition to at least be loaded.


### Icons

This element uses [Microsoft Codicons](https://microsoft.github.io/vscode-codicons/dist/codicon.html).

For them to render properly, ensure the [`codicon` font definition](https://github.com/microsoft/vscode-codicons/blob/main/dist/codicon.css) is loaded in your app.

### Utils

We also export some utilities to make it easier to work with this:

```js
import { replaceSource, resizeMonacoLayout, SD_FUNCTIONS_PATH, SD_CONFIG_PATH } from '@tokens-studio/configurator/utils';

window.addEventListener('resize', resizeMonacoLayout);

replaceSource({
  [SD_CONFIG_PATH]: '{}',
  [SD_FUNCTIONS_PATH]: `import StyleDictionary from 'style-dictionary';
import { register } from '@tokens-studio/sd-transforms';

register(StyleDictionary);`,
  'studio.tokens.json': '{}'
}, {
  run: true,
  clear: 'all'
});
```

The second param of `replaceSource` is  an options object with props:

- `run` -> `true` or `false`, default value: `true`. Whether or not to run Style-Dictionary after replacing the files.
- `clear` -> `true`, `false` or `"all"`, default value: `true`. `"all"` means all files are cleared first, including the Style-Dictionary config and functions files.

> Note that your token files cannot match "config.json", "sd.config.json", "config.js", "sd.config.js", "config.mjs", "sd.config.mjs" or "registerSDFunctions.js".
> These are reserved filenames for the SD Config / Functions files.

### Events

There are a couple of events you can listen to on `window`:

- When the Functions tab content gets saved - `FUNCTIONS_SAVED_EVENT` -> `ev.detail` is the saved content
- When the Config tab content gets saved - `CONFIG_SAVED_EVENT` -> `ev.detail` is the saved content
- When the tokens (input/output) content gets saved - `TOKENS_SAVED_EVENT` -> `ev.detail` is the saved content
- When the input files are created initially or when using `replaceSource()` utility - `INPUT_FILES_CREATED_EVENT`

There's also an event on `sdState` you can listen to, which gives you the updated Style-Dictionary object:

```js
import { sdState, SD_CHANGED_EVENT } from '@tokens-studio/configurator/utils';

sdState.addEventListener(SD_CHANGED_EVENT, (ev) => {
  console.log(ev.detail); // Style-Dictionary object
})
```
