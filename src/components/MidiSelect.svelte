<script lang="typescript">
    import  Select  from 'svelte-select';

    let items = [
    {value: 'chocolate', label: 'Chocolate'},
    {value: 'pizza', label: 'Pizza'},
    {value: 'cake', label: 'Cake'},
    {value: 'chips', label: 'Chips'},
    {value: 'ice-cream', label: 'Ice Cream'},
  ];

  let selectedValue = {value: 'cake', label: 'Cake'};

  function handleSelect(event) {
    console.log('selected item', event.detail);
    
  }
</script>

<span class="ml2 select fit">
<Select  {items} {selectedValue} on:select={handleSelect}></Select>
</span>



<style>


</style>