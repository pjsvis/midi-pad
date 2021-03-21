
<script lang="ts">

import {onMount} from 'svelte'
import type {Input, Output} from 'webmidi'
import {isWebMidi, enableWebMidi, getInputs, getOutputs, playNote, sendCc} from '../utilities/midi-utils'
import JoystickControls from '../components/JoystickControls.svelte'
import TrackControls from './TrackControls.svelte'
import SliderX from './SliderX.svelte'
import SliderY from './SliderY.svelte'
import Knob from './Knob.svelte'

import nipplejs, {JoystickManagerOptions} from 'nipplejs';

// Joystick 
let joy01: unknown
let joy02: unknown
let joy03: unknown
let joy04: unknown

$: incAmount = 0

const zoom = (event: WheelEvent) => {	
	console.log(event)
	const x = event.clientX
	const y = event.clientY
	var delta = Math.max(-1, Math.min(1, (event.deltaY || -event.detail)));
	incAmount = incAmount + delta
	console.log('delta', delta)
	console.log('incAmount', incAmount)
	let focusedEl = document.elementFromPoint(x, y);
	console.log(focusedEl.getAttribute('id'))
}

onMount(async () => {
	incAmount=0
	// Capture mouse wheel
	document.onwheel = zoom;

	// Enable web midi
	enableWebMidi()
		isEnabled=true

	joy01 = nipplejs.create({
			zone: document.getElementById('joy01'),   
			mode: 'static',
			position: {left: '10%', top: '50%'},
			color: 'red',
			size: 200,
			restJoystick: false,
		});

	 joy02 = nipplejs.create({
                zone: document.getElementById('joy02'),
                mode: 'static',
                position: { left: '30%', top: '50%' },
                color: 'green',
                size: 200,
				restJoystick: false,
            });

    joy03 = nipplejs.create({
                zone: document.getElementById('joy03'),
                mode: 'static',
                position: { left: '50%', top: '50%' },
                color: 'red',
                size: 200,
				restJoystick: false,
            });
	joy04 = nipplejs.create({
			zone: document.getElementById('joy04'),
			mode: 'static',
			position: { left: '70%', top: '50%' },
			color: 'green',
			size: 200,
			restJoystick: false,
		});

	});



const btnStyle = 'flex ba b--black-10 pa2 f6 shadow-4 grow fit-w bg-light-red mb1 mr2 pa2 pointer'

let isEnabled= false
let isNotEnabledStyle = "fa fa-times ml2 black"
let isEnabledStyle = "fa fa-check ml2 black"
let inputs: Input[] = []
let outputs: Output[] = []

function handleEnable () {
	const isSupported = isWebMidi()
	isSupported ? console.log('WebMidi supported') : alert('WebMidi not supported')	

	if(isSupported){
		enableWebMidi()
		isEnabled=true
	}else{
		return
	}

} 

const handleShowIO = () => {
	inputs = getInputs()

outputs= getOutputs()

}

const handleSendNotes = () => {
	const note = [42, 44, 46, 48, 50]
	const port = 6
	playNote(port, note)
}

const handleSendCc = () => {
	const value = 127
	const port = 6
	const controller = 14
	sendCc(port, controller, value)
}

const rowTitleClass="ba b--black-10 pa2 tc f5 fw4"
const rowClass="bl br bb b--black-10 pa2 tl f6"





</script>
			
<div>	
	<div class="flex">
		<div></div>
		<div class={btnStyle} on:click={handleEnable}>Enable WebMidi <i class={isEnabled ? isEnabledStyle : isNotEnabledStyle}/></div>
		<div class={btnStyle} on:click={handleShowIO}>Show I/O</div>
		<div class={btnStyle} on:click={handleSendNotes}>Send Notes</div>
		<div class={btnStyle} on:click={handleSendCc}>Send CC</div>		
	</div>
</div>

<div class="flex mt2">
	
	<div>  
		<div class={rowTitleClass}>Inputs</div>  
		{#each inputs as {id, name, state}}
		<div class={rowClass}>{id} :: {name} :: {state}</div>
		{/each}
	</div>
	
	<div class="ml2">    
		<div class={rowTitleClass}>Outputs</div>  
		{#each outputs as {id, name, state}}
		<div class={rowClass}>{id} :: {name} :: {state}</div>
		{/each}
	</div>
	
</div>

<div class="flex mt2">
	<TrackControls />
</div>

<div class="flex mt2">
	<SliderX  />

	IncAmount: {incAmount}
<SliderX  />

</div>

<div class="flex mt2">

	<SliderY  />

<SliderY  />

</div>

<div class="flex mt2">
	<Knob />
	
</div>

<div class="flex mt2">
	<JoystickControls />
</div>

<div id="zone_joystick" class="mt2">

	<div id="joy01" class="zone static active" style="touch-action:none;">
	</div>
   
	<div id="joy02"></div>
	<div id="joy03"></div>
	<div id="joy04"></div>
</div>




<style>
#zone_joystick {
    position: relative;
    background: silver;
    box-sizing: content-box;
    height: 450px;
}

.zone.static {
    background: rgba(255, 0, 0, 0.1);
}

.zone.active {
    display: block;
}

.zone {
    display: none;
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
}

</style>