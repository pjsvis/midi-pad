<script lang="typescript">
import RangeSlider from 'svelte-range-slider-pips'

let vals = [0,10,35,64,78,20,34,120]

</script>

<div class="flex">
	<RangeSlider pips min={0} max={127} values={[vals[0]]} vertical="true"/>
	<RangeSlider pips min={0} max={127} values={[vals[1]]} vertical="true"/>
	<RangeSlider pips min={0} max={127} values={[vals[2]]} vertical="true"/>
	<RangeSlider pips min={0} max={127} values={[vals[3]]} vertical="true"/>
	<RangeSlider pips min={0} max={127} values={[vals[4]]} vertical="true"/>
	<RangeSlider pips min={0} max={127} values={[vals[5]]} vertical="true"/>
	<RangeSlider pips min={0} max={127} values={[vals[6]]} vertical="true"/>
	<RangeSlider pips min={0} max={127} values={[vals[7]]} vertical="true"/>
	
</div>

<style>

</style>