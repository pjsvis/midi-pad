<script lang="typescript">
  
  // TODO: Add hover effect, toggle, onClick, isDisabled


  export let id
  export let title
  export let ccIn
  export let ccOut
  export let isDisabled 

  const btnStyle = 'ba b--blue bw2 b--solid br3 pa2 f6 shadow-5 dim w4 h4 bg-light-red mb3 mr3 pa2 pointer'
    const exBtnStyle = 'button-bare ' + btnStyle
const disabledStyle=''
</script>


<button class={exBtnStyle} disabled={isDisabled}>
  <div>
    <div><div class="flex flex-column">
      <div>CCIn{ccIn}</div>
      <div>CCOut{ccOut}</div>
      <div>{id} {title}</div>
    </div>
    <div class="fr flex flex-column pr2">
      <div><i class="fa fa-chevron-up"/></div>
      <div><i class="fa fa-chevron-down"/></div>
    </div>
  </div>
</button>




<style>

</style>