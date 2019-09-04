import store from './store';
import hotkeys from 'hotkeys-js';
import { DELETE_NOTES, NOTE_SHIFT, SAVE_PROJECT, SELECT_ALL_NOTES } from '../constants/key-bindings';
import mockEntities from '../../test/data/json/mockEntities';
import { SET_ENTITIES } from './store/mutation-types';
import {
  deleteNotes,
  noteShiftDown,
  noteShiftLeft,
  noteShiftRight,
  noteShiftUp,
  selectAllNotes
} from './interactors/Note';
import { saveProject } from './usecases/project';
import { ipcRenderer } from 'electron';
import { DIALOG } from '../constants/event-types';
import { eventHub } from './modules';

// =====================================================================================================================

export const initialize = () => {
  bindKeys();
  listenIpc();
  if (process.env.NODE_ENV === 'development') loadMockEntities();
};

export default initialize;

// =====================================================================================================================

const bindKeys = () => {
  hotkeys(SAVE_PROJECT.keys, SAVE_PROJECT.scope, saveProject);
  hotkeys(SELECT_ALL_NOTES.keys, SELECT_ALL_NOTES.scope, (ev) => { ev.preventDefault(); selectAllNotes(); });
  hotkeys(NOTE_SHIFT.left.keys, NOTE_SHIFT.left.scope, (ev) => { ev.preventDefault(); noteShiftLeft(240); });
  hotkeys(NOTE_SHIFT.right.keys, NOTE_SHIFT.right.scope, (ev) => { ev.preventDefault(); noteShiftRight(240); });
  hotkeys(NOTE_SHIFT.up.keys, NOTE_SHIFT.up.scope, (ev) => { ev.preventDefault(); noteShiftUp(1); });
  hotkeys(NOTE_SHIFT.down.keys, NOTE_SHIFT.down.scope, (ev) => { ev.preventDefault(); noteShiftDown(1); });
  hotkeys(DELETE_NOTES.keys, DELETE_NOTES.scope, (ev) => { ev.preventDefault(); deleteNotes(); });
};

const loadMockEntities = () => {
  store.commit(SET_ENTITIES, mockEntities);
};

const listenIpc = () => {
  ipcRenderer.on(DIALOG, (...args) => {
    eventHub.$emit(DIALOG, ...args);
  });
};
