// @flow
import { Arrangement } from '../../models';
import { APP_ID, ARRANGEMENT_ID } from '../../../constants/ids';

export const createArrangement = () => {
  Arrangement.insert({
    data: {
      id: ARRANGEMENT_ID,
      appId: APP_ID
    }
  });
};
