
<script lang="ts">

import {onMount} from 'svelte'
import type {Input, Output} from 'webmidi'
import {isWebMidi, enableWebMidi, getInputs, getOutputs, playNote, sendCc, disableWebMidi} from '../utilities/midi-utils'

import Menu from './Menu.svelte'
import MidiSelect from './MidiSelect.svelte'
import MacroControls from './MacroControls.svelte'

import { prevent_default, set_attributes } from 'svelte/internal';
import KeyTrap from './KeyTrap.svelte';

// Handle mouse scroll
const zoom = (event: WheelEvent) => {	
	console.log(event)
	const x = event.clientX
	const y = event.clientY
	
	// What element are we scrolling
	let focussedEl = document.elementFromPoint(x, y);
	console.log(focussedEl)

	
	let isDataScroll = focussedEl.getAttribute('data-scroll') !== null
	let isInput = focussedEl instanceof HTMLInputElement
	
	
	// Not scrollable input so exit
	if(!isDataScroll && isInput){return}
	
	
	let inputEl: HTMLInputElement = focussedEl as HTMLInputElement

	// Change value as per scroll direction
	let currentValue = parseInt(inputEl.value)	
	var delta = Math.max(-1, Math.min(1, (event.deltaY || -event.detail)));
	let newValue = delta < 0 ? currentValue + 1 : currentValue - 1

	let inputMax = parseInt(inputEl.max)
	let inputMin = parseInt(inputEl.min)

	inputEl.value =  Math.min(Math.max(parseInt(newValue.toString()), inputMin), inputMax).toString()
	
	console.log('delta', delta)
	console.log('newValue', inputEl.value)	
	prevent_default
	
}

onMount(async () => {	
	// Capture mouse wheel
	document.onwheel = zoom;

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
	<div class="flex mb2">
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