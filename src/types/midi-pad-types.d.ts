


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