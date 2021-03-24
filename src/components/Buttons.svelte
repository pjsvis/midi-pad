
<script lang="ts">

import {onMount} from 'svelte'
import type {Input, Output} from 'webmidi'
import {isWebMidi, enableWebMidi, getInputs, getOutputs, playNote, sendCc, disableWebMidi} from '../utilities/midi-utils'

import Menu from './Menu.svelte'
import MidiSelect from './MidiSelect.svelte'
import MacroControls from './MacroControls.svelte'

import { prevent_default, set_attributes } from 'svelte/internal';
import KeyTrap from './KeyTrap.svelte';
import XYPad from './XYPad.svelte'

// Handle mouse scroll
const zoom = (e: WheelEvent) => {	
	
	console.log(e)
	const x = e.clientX
	const y = e.clientY
	
	const mouseX = e.offsetX;
    const mouseY = e.offsetY;

	// What element are we scrolling
	// TODO: Fix detection
	let focussedEls = document.elementsFromPoint(x, y);
	let focussedEl = focussedEls[0]
	console.log('focussedEls', focussedEl)
	// let focussedEl = document.elementFromPoint(mouseX, mouseY);
	console.log('focussedEl', focussedEl)
	
	
	let isDataScroll =  focussedEl.getAttribute('data-scroll') !== null
	console.log('isDataScroll', isDataScroll)
	// let isInput = focussedEl instanceof HTMLInputElement
	
	
	// Not scrollable input so exit
	if(!isDataScroll){return}
	
	
	// Change value as per scroll direction
	var delta = Math.max(-1, Math.min(1, (e.deltaY || -e.detail)));
	
	// TODO: Find out how to stop scrolling NB None of these work
	// e.stopPropagation(); 
	// e.stopImmediatePropagation(); 
	// e.preventDefault
	// e.preventDefault()
	
	console.log('delta', delta)	
	return false
	
}

onMount(async () => {	
	// Capture mouse wheel
	window.onwheel = zoom;

	// Enable web midi
	enableWebMidi()
	isEnabled=true
	


	
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

const handleDisable = async () => {
	await disableWebMidi()
	isEnabled=false
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
	

<KeyTrap/>


<div>	
	<div class="flex mb2 fr">
		<Menu />
		<MidiSelect />
	</div>
	<div class="flex">		
		<div class={btnStyle} on:click={handleEnable}>Enable WebMidi <i class={isEnabled ? isEnabledStyle : isNotEnabledStyle}/></div>
		<div class={btnStyle} on:click={handleDisable}>Disable WebMidi <i class={isEnabled ? isEnabledStyle : isNotEnabledStyle}/></div>
		<div class={btnStyle} on:click={handleShowIO}>Show I/O</div>
		<div class={btnStyle} on:click={handleSendNotes}>Send Notes</div>
		<div class={btnStyle} on:click={handleSendCc}>Send CC</div>		
	</div>
</div>


<div class="flex mt2 mr2">

	<XYPad />
	
</div>
<!-- Inputs and Outputs -->
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
	<MacroControls />
</div>



<style>


</style>