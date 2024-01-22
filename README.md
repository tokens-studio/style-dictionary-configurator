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

### Icons

This element uses [Microsoft Codicons](https://microsoft.github.io/vscode-codicons/dist/codicon.html).

For them to render properly, ensure the [`codicon` font definition](https://github.com/microsoft/vscode-codicons/blob/main/dist/codicon.css) is loaded in your app.

### Utils

We also export some utilities to make it easier to work with this

```js
import { replaceSource, resizeMonacoLayout } from '@tokens-studio/configurator/utils';

window.addEventListener("resize", resizeMonacoLayout);

replaceSource({
  "config.json": "{}",
  "studio.tokens.json": "{}"
});
```
