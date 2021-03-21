<script lang="typescript">
import { enableWebMidi} from '../utilities/midi-utils'
    import {onMount} from 'svelte'
    // onload enable all tracks
onMount(async () =>{
    enableWebMidi()
})


// onUnload enable all tracks

</script>
<div> 
    <button id="b01" >Enable All</button>
    <button id="b02">Disable All</button>
    <button >Track 1</button>
    <button >Track 2</button>
    <button >Track 3</button>
    <button >Track 4</button>
    <button >Track 5</button>
    <button >Track 6</button>
    <button >Track 7</button>
    <button >Track 8</button>
</div>

<style>
    
</style>