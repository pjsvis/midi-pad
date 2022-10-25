export interface MidiIn {
  channel: number;
  note: number;
  cc: number;
}
export interface MidiOut {
  channel: number;
  note: number;
  cc: number;
}

export interface MidiConvert {
  midiIn: MidiIn;
  midiOut: MidiOut;
}