
<script lang="typescript">
import type { JoystickManager } from 'nipplejs';

import {onMount} from 'svelte'

import {isWebMidi, enableWebMidi, getInputs, getOutputs, playNote, sendCc} from '../utilities/midi-utils'
// import Joystick from '../components/Joystick.svelte'

import nipplejs, {JoystickManagerOptions} from 'nipplejs';

var options: JoystickManagerOptions 
var staticJs
var joystickL
var joysticR

onMount(async () => {
	// Enable web midi
	enableWebMidi()
		isEnabled=true

	// Initialise the joystick
	options = {
		zone: document.getElementById('static'),   
		mode: 'static',
		position: {left: '50%', top: '50%'},
		color: 'red'
	}
	staticJs = nipplejs.create(options);

	 joystickL = nipplejs.create({
                zone: document.getElementById('left'),
                mode: 'static',
                position: { left: '20%', top: '50%' },
                color: 'green',
                size: 200
            });

             joystickR = nipplejs.create({
                zone: document.getElementById('right'),
                mode: 'static',
                position: { left: '80%', top: '50%' },
                color: 'red',
                size: 200
            });


	});

const noop = () => {}

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

<div id="zone_joystick" class="mt2">

	<div id="static" class="zone static active" style="touch-action:none;">
		
	</div>
   
</div>

<div id="left"></div>
<div id="right"></div>


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
#left {
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            width: 50%;
            background: rgba(0, 255, 0, 0.1);
        }

        #right {
            position: absolute;
            right: 0;
            top: 0;
            height: 100%;
            width: 50%;
            background: rgba(0, 0, 255, 0.1);
        }
</style>