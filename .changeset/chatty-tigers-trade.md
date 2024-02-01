---
"@tokens-studio/configurator": patch
---

- Remove direct dep on `memfs`, use `style-dictionary/fs`
- Add `CONFIG_SAVED_EVENT`
- Add `SD_CHANGED_EVENT` on sdState util
- Add the saved content as event data on a couple of events

See [README](https://github.com/tokens-studio/style-dictionary-configurator#events) for more information
