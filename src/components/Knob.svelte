

<script lang="typescript">
    import {onMount} from 'svelte'
import { prevent_default } from 'svelte/internal';

onMount(async () => {
    console.log('knob mounted')
})




  </script>


Hover over slider and scroll mouse wheel
<form>
    <input class="pointer" type="range" min="0" max="127" data-scroll value="63">
</form>
<style>
  
</style>




  