<script lang="typescript">
  import { initialMidipadConfig } from '../stores/midipad-config'
  import { get } from "svelte/store";
  import MacroButton from "./MacroButton.svelte";

  const macroStates = initialMidipadConfig.macroStates;
</script>

<div class="cb">
  <div class="flex">
    {#each macroStates.slice(0,7) as config, i}
      <MacroButton {config} />
    {/each}
  </div>
  
  <div class="flex">
    {#each  macroStates.slice(8, 15) as config, i}
      <MacroButton {config} />
    {/each}
  </div>
  <div class="flex">
    {#each  macroStates.slice(16, 23) as config, i}
      <MacroButton {config} />
    {/each}
  </div>
  <div class="flex">
    {#each macroStates.slice(24, 31) as config, i}
      <MacroButton {config} />
    {/each} 
  </div>
</div>

<style>
</style>
