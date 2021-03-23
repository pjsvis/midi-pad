<script lang="typescript">
  import MacroButton from './MacroButton.svelte' 
  import {midiPadData} from '../stores/midipad-config'
      
  const btnStyle = 'ba b--blue bw2 b--solid br3 pa2 f6 shadow-5 dim w4 h4 bg-light-red mb3 mr3 pa2 pointer'
  const exBtnStyle = 'button-bare ' + btnStyle

  // TODO: Split into 4 banks
  const macroStates = midiPadData.macroStates 

  const bank1 = macroStates.slice(0,7)
  const bank2 = macroStates.slice(8,15)
  const bank3 = macroStates.slice(16,23)
  const bank4 = macroStates.slice(24,31)

</script>
    
<div class="cb">

  <div class="flex">
      {#each  bank1 as {id, title, ccIn, ccOut, isDisabled }, i}
        <MacroButton id={id} title={title} ccIn={ccIn} ccOut={ccOut} isDisabled={isDisabled} />
      
      {/each}  
  </div>
  <div class="flex">
      {#each  bank2 as {id, title, ccIn, ccOut, isDisabled }, i}
        <MacroButton id={id} title={title} ccIn={ccIn} ccOut={ccOut} isDisabled={isDisabled} />
      
      {/each}  
  </div>
  <div class="flex">
      {#each  bank3 as {id, title, ccIn, ccOut, isDisabled }, i}
        <MacroButton id={id} title={title} ccIn={ccIn} ccOut={ccOut} isDisabled={isDisabled} />
      
      {/each}  
  </div>
  <div class="flex">
      {#each  bank4 as {id, title, ccIn, ccOut, isDisabled }, i}
        <MacroButton id={id} title={title} ccIn={ccIn} ccOut={ccOut} isDisabled={isDisabled} />
      
      {/each}  
  </div>
</div>


    
    <style>

/*
  TODO: Create a highlight kind of class
  Dim element on hover by adding the dim class.
*/
.dim {
  opacity: 1;
  transition: opacity .15s ease-in;
}
.dim:hover,
.dim:focus {
  opacity: .5;
  transition: opacity .15s ease-in;
}
.dim:active {
  opacity: .8; transition: opacity .15s ease-out;
}
    </style>