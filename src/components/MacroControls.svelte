<script lang="typescript">
  import MacroButton from "./MacroButton.svelte";
  import { macroStatesStore } from "../stores/midipad-store";
</script>

<div class="cb">
  <div class="flex">
    {#each $macroStatesStore.slice(0, 7) as config, i}
      <MacroButton {config} />
    {/each}
  </div>
  <div class="flex">
    {#each $macroStatesStore.slice(8, 15) as config, i}
      <MacroButton {config} />
    {/each}
  </div>
  <div class="flex">
    {#each $macroStatesStore.slice(16, 23) as config, i}
      <MacroButton {config} />
    {/each}
  </div>
  <div class="flex">
    {#each $macroStatesStore.slice(23, 31) as config, i}
      <MacroButton {config} />
    {/each}
  </div>
</div>

<style>
</style>
