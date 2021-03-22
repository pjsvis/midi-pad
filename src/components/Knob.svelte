<script lang="typescript">
    import {onMount} from 'svelte'

    // TODO: Add props for max min value title
    // TODO: Use flex for layout
onMount(async () => {
    console.log('knob mounted')
})

const showCaption = (event) => {
    console.log('showwCaption', event)
    
}
  </script>

<div class="vertical grow ba b--black-10 pa2 grow fit-w  mb2"> 
  
    <input  class="pointer" type="range" min="0" max="127" data-scroll value="63" on:input={showCaption}>
  
    <div  class="rotateText f7">63</div>
 
</div>
<style>
 .vertical{ -webkit-transform:rotate(-90deg);}
 .rotateText{-webkit-transform:rotate(90deg);}
</style>




  