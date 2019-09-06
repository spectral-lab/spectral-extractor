// @flow
import { dialogEventHub } from '../modules';
import { CLIP } from '../../constants/model-types';
import { INSPECT } from '../../constants/dialog-types';

// =====================================================================================================================

export type Option = {
  label: string,
  click(any): any
}

export interface IContextMenuTemplates {
  [key: string]: Option[]
}

// =====================================================================================================================

// $FlowFixMe
export const contextMenuTemplates: IContextMenuTemplates = {
  [CLIP]: [
    {
      label: 'Inspect',
      click ({ id }) {
        dialogEventHub.emit(null, {
          type: INSPECT,
          context: CLIP,
          id
        });
      }
    }
  ]
};

export default contextMenuTemplates;
