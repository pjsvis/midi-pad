<script lang="typescript">
    import { Textfield } from 'svelte-mui';

let value = 'world';
</script>

<Textfield bind:value filled label="Name" message="Enter your name" />

<h1>Hello {value}!</h1>




<style>

</style>