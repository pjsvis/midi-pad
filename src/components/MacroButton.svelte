<script lang="typescript">
import type { MacroState } from "../types/midi-pad-types";


  // TODO: Add hover effect, toggle, onClick, isDisabled

  // TODO: Use object instead of items
  // export let id: number;
  // export let title: string;
  // export let ccIn: number;
  // export let ccOut: number;
  // export let isDisabled: boolean;

  export let config: MacroState;

  let {id, title, ccIn, ccOut, isDisabled} = config;

  const btnStyle =
    "ba b--blue bw2 b--solid br3 pa2 f6 shadow-5 dim w3 h3  white mb3 mr3 pa2 pointer";
  const exBtnStyle = "button-bare " + btnStyle;
  const disabledStyle = "";
</script>

<button data-scroll data-cc={ccOut} class={exBtnStyle} disabled={isDisabled}>
  <div data-scroll data-cc={ccOut}>
    <div data-scroll data-cc={ccOut}>
      <div data-scroll data-cc={ccOut} class="flex flex-column">
        <!-- <div data-scroll data-cc={ccOut}>cc {ccIn} => {ccOut}</div>    -->
        <div data-scroll data-cc={ccOut}>CC{ccOut}</div>
        <!-- <div data-scroll data-cc={ccOut}>{title}</div> -->
      </div>
      <div data-scroll data-cc={ccOut} class="fr flex flex-column pr2">
        <!-- <div data-scroll data-cc={ccOut}><i data-scroll data-cc={ccOut} class="fa fa-chevron-up"/></div> -->
        <!-- <div data-scroll data-cc={ccOut}><i data-scroll data-cc={ccOut} class="fa fa-chevron-down"/></div> -->
      </div>
    </div>
  </div></button
>

<style>

</style>
