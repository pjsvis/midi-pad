
export   type MacroNumber = 1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25|26|27|28|29|30|31|32;

export type BankName = 'A' | 'B' | 'C' | 'D';
export interface MidipadConfig{

    id: number;
    title: string;
    description: string;
    macroStates: MacroState[];
    midiPortsIn: string[];
    midiPortsOut: string[];
}

interface MacroState{
  id: MacroNumber;
  title: string;
  ccIn: number;
  ccOut: number;
  isDisabled: boolean;
}
interface MidiPorts {
  portsIn: string[];
  portsOut: string[];
}
// Interfaces for X-Y pad
interface Cc {
    stereoWidth: number;
    distance: number;
    azimuth: number;
    elevation: number;
}

interface Value {
    stereoWidth: number;
    distance: number;
    azimuth: number;
    elevation: number;
}

type JoystickName = 'J1A' | 'J1B' 

export interface Joystick {
    name: JoystickName;
    cc: Cc;
    value: Value
}


export interface JoyData {
    J1A: Joystick;
    J1B: Joystick;
}

export interface MacroCc {
    Macro: number;
    Cc: number;
}

export interface MacroCcAssignment {
    MacroCcs: MacroCc[];
}
export as namespace MidiPad