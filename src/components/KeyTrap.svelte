<script lang="typescript">
    import {onMount} from 'svelte'
import Mousetrap from'mousetrap'

const bindKeys = () => {

     // TODO: Set active bank for midi input
    Mousetrap.bind('b 1', () => {        
        console.log('b 1')       
        return false});
        Mousetrap.bind('b 2', () => {        
        console.log('b 2')       
        return false});
        Mousetrap.bind('b 3', () => {        
        console.log('b 3')       
        return false});
        Mousetrap.bind('b 4', () => {        
        console.log('b 4')       
        return false});
    
        // TODO: Handle param change for active macro
    Mousetrap.bind('up', function() {
        console.log('up')  
     return false
    });
    Mousetrap.bind('down', function() {
        console.log('down')  
     return false
    });
    Mousetrap.bind('left', function() {
        console.log('left')  
     return false
    });
    Mousetrap.bind('right', function() {
        console.log('right')  
     return false
    });
    Mousetrap.bind('shift+up', function() {
        console.log('shift+up')  
     return false
    });
    Mousetrap.bind('shift+down', function() {
        console.log('shift+down')  
     return false
    });
    Mousetrap.bind('shift+left', function() {
        console.log('shift+left')  
     return false
    });
    Mousetrap.bind('shift+right', function() {
        console.log('shift+right')  
     return false
    });

}

onMount(()=>{
bindKeys()
})
    </script>

    <style>


    </style>