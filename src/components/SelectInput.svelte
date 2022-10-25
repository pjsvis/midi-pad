<script lang="typescript">
  import type { Input } from "webmidi";
  export let inputs: Input[];

  const rowTitleClass = "ba b--black-10 pa2 tc f5 fw4";
  const rowClass = "bl br bb b--black-10 pa2 tl f6";
</script>

<select>
  <option>Inputs</option>
  {#each inputs as input}
    <option value={input.id}>{input.id}: {input.name}</option>
  {/each}
</select>

<style>
</style>
