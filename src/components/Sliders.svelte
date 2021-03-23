<script lang="typescript">
import RangeSlider from 'svelte-range-slider-pips'

let vals = [0,10,35,64,78,20,34,120]

const btnStyle = 'flex ba b--black-10 pa2 f6 shadow-4 grow fit-w bg-light-red mb1 mr2 pa2 pointer'
</script>

<div class="w100">
	<RangeSlider pips min={0} max={127} values={[vals[0]]} vertical="true"/>
	<RangeSlider pips min={0} max={127} values={[vals[1]]} vertical="true"/>
	<RangeSlider pips min={0} max={127} values={[vals[2]]} vertical="true"/>
	<RangeSlider pips min={0} max={127} values={[vals[3]]} vertical="true"/>
	<RangeSlider pips min={0} max={127} values={[vals[4]]} vertical="true"/>
	<RangeSlider pips min={0} max={127} values={[vals[5]]} vertical="true"/>
	<RangeSlider pips min={0} max={127} values={[vals[6]]} vertical="true"/>
	<RangeSlider pips min={0} max={127} values={[vals[7]]} vertical="true"/>
	
	
</div>
<div class="w100">
	
	<div class={btnStyle}>Fader</div>
	<div class={btnStyle}>One</div>
	<div class={btnStyle}>Two</div>
	<div class={btnStyle}>Three</div>
	<div class={btnStyle}>Four</div>
	
</div>

<style>

</style>