<script lang="typescript">



// import JZZ from 'jzz';

const btnStyle = 'flex ba b--black-10 pa2 f6 shadow-4 grow fit-w bg-light-red mb1 mr1 pa2 pointer'

const midiTest = () => {
	// JZZ().or('Cannot start MIDI engine!')
    //    .openMidiOut().or('Cannot open MIDI Out port!')
    //    .wait(500).send([0x90,60,127])
    //    .wait(500).send([0x90,64,127])
    //    .wait(500).send([0x90,67,127])
    //    .wait(500).send([0x90,72,127])
    //    .wait(1000).send([0x90,60,0]).send([0x90,64,0]).send([0x90,67,0]).send([0x90,72,0])
    //    .and('thank you!');	
	   // and goodbye
}

function handleClick () {
	console.log('hello there ')	
	midiTest()
}


// Help
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

<style>

</style>