<script lang="typescript">
  import type { Input } from "webmidi";
  export let inputs: Input[];

  const rowTitleClass = "ba b--black-10 pa2 tc f5 fw4";
  const rowClass = "bl br bb b--black-10 pa2 tl f6";
</script>

<div class={rowTitleClass}>Outputs</div>
{#each inputs as input}
  <div class={rowClass}>{input.id} :: {input.name} :: {input.state}</div>
{:else}
  <div />
  }
{/each}

<style>
</style>
