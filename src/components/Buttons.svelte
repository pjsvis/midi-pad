
<script lang="typescript">

import {isWebMidi, enableWebMidi, getInputs, getOutputs, playNote, sendCc} from '../utilities/midi-utils'


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

<style>

</style>