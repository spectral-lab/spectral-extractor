import { Model } from '@vuex-orm/core';
import {
  NOTE_ON, NOTE_OFF, MODULATION,
  NOTE, SPECTROGRAM, AUDIO_BUFFER, CLIP,
  TRACK, SONG, APP, PIANO_ROLL, ARRANGEMENT
} from '../constants/model-types';
import { makeMandatory, setHotkeysScope } from './utils';
import { bpm, beatsInBar, ticksPerBeat } from '../constants/defaults';
import { SELECT } from '../constants/mouse-modes';
import { random, sum } from 'lodash';
import { SCALE_COLORS } from '../constants/colors';

class BaseModel extends Model {
  get path () {
    if (!this.parent) return [this];
    return [...this.parent.path, this];
  }
  get absoluteTime () {
    const offsetTimes = this.path.map(modelInstance => {
      const offset = modelInstance.offsetTime;
      return offset == null ? 0 : offset;
    });
    return sum(offsetTimes);
  }
}

export class NoteOn extends BaseModel {
  static entity = 'noteOns';

  static fields () {
    return {
      id: this.attr(null, makeMandatory('id')),
      noteId: this.attr(null),
      type: this.string(NOTE_ON),
      noteOnVelocity: this.number(0.5), // from 0.0 to 1.0.
      pitchBend: this.number(0), // in midi note number. Negative float is acceptable.
      timbre: this.number(0.5), // from 0.0 to 1.0.
      pressure: this.number(0.5), // from 0.0 to 1.0.
      selected: this.boolean(false)
    };
  }
  get parent () {
    return Note.query().whereId(this.noteId).first();
  }
}

export class Modulation extends BaseModel {
  static entity = 'modulations';
  static fields () {
    return {
      id: this.attr(null, makeMandatory('id')),
      noteId: this.attr(null),
      type: this.string(MODULATION),
      offsetTime: this.number(1), // in tick
      pitchBend: this.number(null).nullable(), // in midi note number. Negative float is acceptable.
      pressure: this.number(null).nullable(), // from 0.0 to 1.0.
      timbre: this.number(null).nullable(), // from 0.0 to 1.0.
      selected: this.boolean(false)
    };
  }
  get parent () {
    return Note.query().whereId(this.noteId).first();
  }
}

export class NoteOff extends BaseModel {
  static entity = 'noteOffs';
  static fields () {
    return {
      id: this.attr(null, makeMandatory('id')),
      noteId: this.attr(null),
      type: this.string(NOTE_OFF),
      offsetTime: this.number(1), // in tick
      noteOffVelocity: this.number(0),
      pitchBend: this.number(null).nullable(), // in midi note number. Negative float is acceptable.
      pressure: this.number(null).nullable(), // from 0.0 to 1.0.
      timbre: this.number(null).nullable(), // from 0.0 to 1.0.
      selected: this.boolean(false)
    };
  }
  get parent () {
    return Note.query().whereId(this.noteId).first();
  }
}

export class Note extends BaseModel {
  static entity = 'notes';
  static fields () {
    return {
      id: this.attr(null, makeMandatory('id')),
      type: this.string(NOTE),
      clipId: this.attr(null, makeMandatory('clipId')),
      noteNumber: this.number(60),
      offsetTime: this.number(0), // in tick
      noteOn: this.hasOne(NoteOn, 'noteId'),
      noteOff: this.hasOne(NoteOff, 'noteId'),
      modulations: this.hasMany(Modulation, 'noteId'),
      selected: this.boolean(false),
      interpolation: this.string('LINEAR')
    };
  }
  get noteActions () {
    return [
      this.noteOn,
      ...this.modulations,
      this.noteOff
    ];
  }
  get pitchTransition () {
    const pitchBendMods = this.modulations.filter(mod => mod.pitchBend !== null);
    const noteActions = [{ offsetTime: 0, ...this.noteOn }, ...pitchBendMods, this.noteOff && this.noteOff].filter(v => v);
    return noteActions.map(noteAction => ({
      offsetTime: this.offsetTime + noteAction.offsetTime,
      pitch: this.noteNumber + noteAction.pitchBend,
      id: noteAction.id,
      type: noteAction.type
    }));
  }
  get parent () {
    return Clip.query().whereId(this.clipId).first();
  }
}

export class AudioBuffer extends BaseModel {
  static entity = 'audioBuffers';
  static fields () {
    return {
      id: this.attr(null, makeMandatory('id')),
      type: this.string(AUDIO_BUFFER),
      clipId: this.attr(null, makeMandatory('clipId')),
      offsetTime: this.number(0),
      data: this.attr(null),
      originalFilePath: this.string(''),
      spectrogram: this.hasOne(Spectrogram, 'audioBufferId')
    };
  }
  get parent () {
    return Clip.query().whereId(this.clipId).first();
  }
}

export class Spectrogram extends BaseModel {
  static entity = 'spectrograms';
  static fields () {
    return {
      id: this.attr(null, makeMandatory('id')),
      type: this.string(SPECTROGRAM),
      audioBufferId: this.attr(null),
      times: this.attr([]),
      freqs: this.attr([]),
      magnitude2d: this.attr([[]])
    };
  }
  get parent () {
    return AudioBuffer.query().whereId(this.audioBufferId).first();
  }
}

export class Clip extends BaseModel {
  static entity = 'clips';
  static fields () {
    return {
      id: this.attr(null, makeMandatory('id')),
      type: this.string(CLIP),
      offsetTime: this.number(0), // in tick
      duration: this.number(4 * beatsInBar * ticksPerBeat), // 4 bars
      notes: this.hasMany(Note, 'clipId'),
      audioBuffer: this.hasOne(AudioBuffer, 'clipId'),
      beatsInBar: this.attr([{ barIdx: 0, val: beatsInBar }]),
      selected: this.boolean(false),
      trackId: this.attr(null),
      color: this.attr(() => SCALE_COLORS.hHelmholtz[random(11)])
    };
  };
  get parent () {
    return Track.query().whereId(this.trackId).first();
  }
}

export class Track extends BaseModel {
  static entity = 'tracks';
  static fields () {
    return {
      id: this.attr(null, makeMandatory('id')),
      type: this.string(TRACK),
      speed: this.attr([{ offsetTime: 0, val: 1 }]),
      selected: this.boolean(false),
      songId: this.attr(null),
      clips: this.hasMany(Clip, 'trackId')
    };
  }
  get parent () {
    return Song.query().whereId(this.songId).first();
  }
}

export class Song extends BaseModel {
  static entity = 'songs';
  static fields () {
    return {
      id: this.attr(null, makeMandatory('id')),
      type: this.string(SONG),
      bpm: this.number(bpm),
      ticksPerBeat: this.number(ticksPerBeat),
      tracks: this.hasMany(Track, 'songId')
    };
  }
  get parent () {
    return null;
  }
}

export class PianoRoll extends BaseModel {
  static entity = 'pianoRoll';
  static fields () {
    return {
      id: this.attr(null, makeMandatory('id')),
      type: this.string(PIANO_ROLL),
      appId: this.attr(null, makeMandatory('appId')),
      gridOpacity: this.attr(1),
      spectrogramOpacity: this.attr(1),
      mouseMode: this.string(SELECT)
    };
  }
  get parent () {
    return App.query().whereId(this.appId).first();
  }
}

export class Arrangement extends BaseModel {
  static entity = 'arrangement';
  static fields () {
    return {
      id: this.attr(null, makeMandatory('id')),
      type: this.string(ARRANGEMENT),
      appId: this.attr(null, makeMandatory('appId')),
      mouseMode: this.string(SELECT)
    };
  }
  get parent () {
    return App.query().whereId(this.appId).first();
  }
}

export class App extends BaseModel {
  static entity = 'app';
  static fields () {
    return {
      id: this.attr(null, makeMandatory('id')),
      type: this.string(APP),
      selectedZone: this.string(PIANO_ROLL, setHotkeysScope)
    };
  }
  get parent () {
    return null;
  }
}
