// @flow
import MemberChannel from './MemberChannel';
import { INoteControl, NoteControl } from './NoteControl';
import { outputManagerOptions } from '../../../constants/defaults';
// eslint-disable-next-line no-unused-vars
import { NoteOn } from '../../store/models';
// eslint-disable-next-line no-unused-vars
import type { Send, Now } from '../../../types';

interface Options {
  send?: Send;
  pitchBendRange?: number;
  nowCb?: Now;
  memberChannels?: number[];
  masterChannels?: number[];
}

export interface IOutputManager {
  noteOn (noteOn: NoteOn, timestamp: number): INoteControl;
  send: Send;
}

export class OutputManager implements IOutputManager {
  _pitchBendRange: number;

  _now: Now;

  send: Send;

  _memberChannels: MemberChannel[];

  constructor (options: Options): void {
    const defaultedOptions = Object.assign({}, outputManagerOptions, options);
    this._pitchBendRange = defaultedOptions.pitchBendRange;
    this._now = defaultedOptions.nowCb;
    this.send = defaultedOptions.send;
    // TODO: Implement MasterChannel
    this._memberChannels = defaultedOptions.memberChannels
      .map(midiChannel => new MemberChannel({
        midiChannel,
        nowCb: this._now,
        pitchBendRange: this._pitchBendRange
      }));
  }

  /**
   * @param  {number} timestamp Either in tick
   */
  noteOn (noteOn: NoteOn, timestamp: number = 0): NoteControl {
    const channelToSend = this.allocateChannel();
    const midiMessages = channelToSend.noteOn(noteOn);
    midiMessages.forEach(message => this.send(message, timestamp));
    return this.createNoteControl(channelToSend);
  }

  findMemberChannel (midiChannel: number): MemberChannel {
    const memberChannel = this._memberChannels.find(channel => channel.midiChannel === midiChannel);
    if (memberChannel) return memberChannel;
    return this._memberChannels[0];
  }

  set pitchBendRange (val: number) {
    this._memberChannels.forEach(channel => { channel.pitchBendRange = val; });
    this._pitchBendRange = val;
  }

  allocateChannel (): MemberChannel {
    const unoccupiedChannels = this._memberChannels.filter(memberChannel => !memberChannel.isOccupied);
    if (unoccupiedChannels.length === 0) {
      const channelWithOldestLastNoteOn = this._memberChannels
        .reduce((acc, memberChannel: MemberChannel) => memberChannel.timeOfLastNoteOn < acc.timeOfLastNoteOn ? memberChannel : acc, this._memberChannels[0]);
      return channelWithOldestLastNoteOn;
    }
    const channelWithOldestLastNoteOff = unoccupiedChannels
      .reduce((acc, memberChannel) => memberChannel.timeOfLastNoteOff < acc.timeOfLastNoteOff ? memberChannel : acc, unoccupiedChannels[0]);
    return channelWithOldestLastNoteOff;
  }

  createNoteControl (memberChannel: MemberChannel): NoteControl {
    const modulateCb = (modulation, timestamp = 0) => {
      const midiMessages = memberChannel.modulate(modulation);
      midiMessages.forEach(message => this.send(message, timestamp));
    };
    const noteOffCb = (noteOff, timestamp = 0) => {
      const midiMessages = memberChannel.noteOff(noteOff);
      midiMessages.forEach(message => this.send(message, timestamp));
    };
    return new NoteControl(modulateCb, noteOffCb);
  }
}

export default OutputManager;