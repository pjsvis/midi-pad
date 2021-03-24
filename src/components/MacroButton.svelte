<script lang="typescript">
  
  // TODO: Add hover effect, toggle, onClick, isDisabled


  export let id: number
  export let title: string
  export let ccIn: number
  export let ccOut: number
  export let isDisabled: boolean

  const btnStyle = 'ba b--blue bw2 b--solid br3 pa2 f6 shadow-5 dim w4 h4  white mb3 mr3 pa2 pointer'
    const exBtnStyle = 'button-bare ' + btnStyle
const disabledStyle=''
</script>


<button data-scroll class={exBtnStyle} disabled={isDisabled}>
  <div data-scroll>
    <div data-scroll><div data-scroll class="flex flex-column">
      <div data-scroll>cc {ccIn} => {ccOut}</div>     
      <div data-scroll>{title}</div>
    </div>
    <div data-scroll class="fr flex flex-column pr2">
      <div data-scroll><i data-scroll class="fa fa-chevron-up"/></div>
      <div data-scroll><i data-scroll class="fa fa-chevron-down"/></div>
    </div>
  </div>
</button>




<style>

</style>