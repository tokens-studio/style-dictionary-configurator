# @tokens-studio/token-configurator

## 0.0.12

### Patch Changes

- a750990: Simplify some of the async filesystem populating utils.

## 0.0.11

### Patch Changes

- 3ac64ba: Expose downloadZIP utility, allows downloading output files by default, or specify a files object in case you want more than that.

## 0.0.10

### Patch Changes

- Fix clearAll() function to wait for Monaco loaded when setting the editors to ""

## 0.0.9

### Patch Changes

- Export ensureMonacoIsLoaded util for easier use of replaceSource util, which doesn't work very well if Monaco isn't loaded.

## 0.0.8

### Patch Changes

- f92ae69: Fix infinite looping file theme extension in output destination.

## 0.0.7

### Patch Changes

- Fix $themes check issue.

## 0.0.6

### Patch Changes

- 028d254: Consider no themes are present when an empty array is the content of a $themes.json.

## 0.0.5

### Patch Changes

- 5d3a13b: Allow prevent-init attribute to not initialize the configurator-element. Users can call .init() themselves e.g. after initializing the source files with the replaceSource utility.

## 0.0.4

### Patch Changes

- 7ca6b2d: Add missing import of event constant.

## 0.0.3

### Patch Changes

- afdea04: - Remove direct dep on `memfs`, use `style-dictionary/fs`

  - Add `CONFIG_SAVED_EVENT`
  - Add `SD_CHANGED_EVENT` on sdState util
  - Add the saved content as event data on a couple of events

  See [README](https://github.com/tokens-studio/style-dictionary-configurator#events) for more information

## 0.0.2

### Patch Changes

- f2d0117: Remove redundant assets from src folder.

## 0.0.1

### Patch Changes

- 2935ed8: Publish configurator as an NPM package for reuse.
