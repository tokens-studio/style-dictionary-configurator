import { Models } from '@rematch/core';
import { styleState } from './style';

export interface RootModel extends Models<RootModel> {
  style: typeof styleState;
}
