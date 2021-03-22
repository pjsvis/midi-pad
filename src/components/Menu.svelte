<script lang="typescript">
    import { Menu, Menuitem, Button, Icon } from 'svelte-mui';


const noop = () => {}
</script>

<Menu origin="top left">
    <div slot="activator">
        <Button color="primary" outlined ripple={false} style="padding-right: 4px;">
            <span>Menu</span>
           <i class="fa fa-check ml1 mr1"></i>
        </Button>
    </div>

    <Menuitem on:click={noop}>Refresh</Menuitem>
    <Menuitem on:click={noop}>Send feedback</Menuitem>
    <Menuitem on:click={noop} disabled>Settings</Menuitem>
    <Menuitem on:click={noop}>Help</Menuitem>
    <Menuitem on:click={noop}>Sign In</Menuitem>
    <hr />
    <Menuitem href="https://svelte.dev" target="_blank">Svelte</Menuitem>
</Menu>




<style>

</style>