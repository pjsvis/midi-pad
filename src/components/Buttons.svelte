
<script lang="typescript">

import {isWebMidi, enableWebMidi, getInputs, getOutputs} from '../utilities/midi-utils'

const noop = () => {}

const btnStyle = 'flex ba b--black-10 pa2 f6 shadow-4 grow fit-w bg-light-red mb1 mr1 pa2 pointer'

let inputs: Input[] = []
let outputs: Output[] = []

function handleClick () {
	const isSupported = isWebMidi()
	isSupported ? console.log('WebMidi supported') : console.log('WebMidi not supported')	

	if(isSupported){
		enableWebMidi()
	}else{
		return
	}

inputs = getInputs()
console.log(inputs)
outputs= getOutputs()
console.log(outputs)
} 


</script>
			
<div>
	<h1>Buttons</h1>
	<div class="flex">
		<button class={btnStyle} on:click={handleClick}>Button 01</button>
		<div class={btnStyle}>Button 02</div>
		<div class={btnStyle}>Button 03</div>
		<div class={btnStyle}>Button 04</div>
		<div class={btnStyle}>Button 05</div>
		<div class={btnStyle}>Button 06</div>
		<div class={btnStyle}>Button 07</div>
		<div class={btnStyle}>Button 08</div>
		
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