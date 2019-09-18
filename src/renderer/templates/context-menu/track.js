// @flow
import { dialogEventHub } from '../../modules';
import { INSPECT } from '../../../constants/dialog-types';
import { TRACK } from '../../../constants/model-types';
import { exportJson } from '../../usecases/jsonExport';
import type { Option } from './types';

export const track: Option[] = [
  {
    label: 'Inspect',
    click ({ id }) {
      dialogEventHub.emit(null, {
        type: INSPECT,
        context: TRACK,
        id
      });
    }
  },
  {
    label: 'Export Track as JSON',
    async click ({ id }) {
      await exportJson(TRACK, id);
    }
  }
];