import { RematchDispatch, init } from '@rematch/core';
import { RootModel, models } from './models';
import { StyleState } from './models/style';

export const store = init({
  models,
  redux: {
    devtoolOptions: {},
    rootReducers: {
      RESET_APP: () => undefined
    }
  }
});

export type Dispatch = RematchDispatch<RootModel>;
export type RootState = {
  style: StyleState;
};
