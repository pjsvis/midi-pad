<script lang="typescript">
  import type { Output } from "webmidi";
  export let outputs: Output[];
</script>

<select>
  <option>Outputs</option>
  {#each outputs as output}
    <option value={output.id}>{output.id}: {output.name}</option>
  {/each}
</select>

<style>
</style>
