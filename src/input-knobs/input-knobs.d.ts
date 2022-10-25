declare global {
	interface Window {
		inputKnobsOptions: InputKnobsOptions;
	}
}

export type KnobMode = 'linear' | 'circularabs' | 'circularrel';
export type SliderMode = 'relative' | 'abs';

export interface InputKnobsOptions {
  knobWidth: number;
  knobHeight: number;
  knobDiameter: number;
  sliderWidth: number;
  sliderHeight: number;
  sliderDiameter: number;
  switchWidth: number;
  switchHeight: number;
  switchDiameter: number;
  fgcolor: string;
  bgcolor: string;
  knobMode: KnobMode;
  sliderMode: SliderMode;
}

export type IType = 'k' | 'h' | 'v';

 interface DragFrom {x: number, y: number, a: number, v: number}
export interface IK {
  sensex: number;
  sensey: number;
  itype: IType;
  frameheight: number;
  sprites: number;
  valrange: {min: number, max: number, step: number};
  oldvalue: number;
  valueold: number;
  knobMode: KnobMode;
  dragfrom: DragFrom;
  pointerdown: (ev: any) => void;
  pointermove: (ev: any) => void;
  pointerup: (ev: any) => void;
  preventScroll:(ev: any) => void;
  keydown: (ev: any) => void;
  wheel: (ev: any) => void;
}

type KnobType = 'range'  | 'switch' | 'slider' | 'checkbox' | 'radio';

export interface InputKnob {
  type:  KnobType;
  
}


