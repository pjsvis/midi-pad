<script lang="typescript">
  import type { Output } from "webmidi";
  export let outputs: Output[];

  const rowTitleClass = "ba b--black-10 pa2 tc f5 fw4";
  const rowClass = "bl br bb b--black-10 pa2 tl f6";
</script>

<div class={rowTitleClass}>Outputs</div>
{#each outputs as output}
  <div class={rowClass}>{output.id} :: {output.name} :: {output.state}</div>
{:else}
  <div />
  }
{/each}

<style>
</style>
