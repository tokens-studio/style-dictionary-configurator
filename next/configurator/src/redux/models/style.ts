import { RootModel } from './root';
import { createModel } from '@rematch/core';


interface Config {
  platforms: Record<string, {
    transformGroup: string,
    transforms: string[]
  }>;
}

export interface StyleState {
  //TODO type theser
  config: Config
  sd: any[];
  themes: Record<string, any>;
  themedConfigs: any[];
  hasInitializedConfig: boolean
  hasInitialized: boolean
}

const initialState = {
  sd: [],
  config: {
    platforms: {}
  },
  themes: {},
  themedConfigs: [],
  hasInitializedConfig: false,
  hasInitialized: false
} as StyleState;

export const styleState = createModel<RootModel>()({
  state: initialState,
  reducers: {
    setConfig: (state, config) => {
      return {
        ...state,
        config,
        hasInitializedConfig: true
      }
    },

  },
  effects: (dispatch) => ({
    setConfig: (payload, rootState) => {
      let shouldWarn = false;
      if (rootState.style.config.platforms) {
        for (const [, platform] of Object.entries(rootState.style.config.platforms)) {
          if (platform.transformGroup && platform.transforms) {
            shouldWarn = true;
          }
        }
      }
      if (shouldWarn) {
        // snackbar.show(
        //   html`
        //     <p>Transforms and transformGroup should not be combined.</p>
        //     <p>
        //       See
        //       <a href="https://github.com/amzn/style-dictionary/issues/813"
        //         >https://github.com/amzn/style-dictionary/issues/813</a
        //       >
        //     </p>
        //   `
        // );
      }
    }

  })
});
