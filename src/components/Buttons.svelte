
<script lang="typescript">

import {isWebMidi, enableWebMidi, getInputs, getOutputs, playNote, sendCc} from '../utilities/midi-utils'


const noop = () => {}

const btnStyle = 'flex ba b--black-10 pa2 f6 shadow-4 grow fit-w bg-light-red mb1 mr1 pa2 pointer'

let inputs: Input[] = []
let outputs: Output[] = []

function handleEnable () {
	const isSupported = isWebMidi()
	isSupported ? console.log('WebMidi supported') : alert('WebMidi not supported')	

	if(isSupported){
		enableWebMidi()
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
</script>
			
<div>
	<h1>Buttons</h1>
	<div class="flex">
		<button class={btnStyle} on:click={handleEnable}>Enable WebMidi</button>
		<div class={btnStyle} on:click={handleShowIO}>Show I/O</div>
		<div class={btnStyle} on:click={handleSendNotes}>Send Notes</div>
		<div class={btnStyle} on:click={handleSendCc}>Send CC</div>		
	</div>
</div>

<h2>Inputs</h2>
<ul>    
	{#each inputs as {id, name, state, _midiInput}, i}
	<li>{id}: {name} {state} {_midiInput.version}</li>
  	{/each}
</ul>

<h2>Outputs</h2>
<ul>    
	{#each outputs as {id, name, state, _midiOutput}, i}
	<li>{id}: {name} {state} {_midiOutput.version}</li>
  	{/each}
</ul>


<style>

</style>