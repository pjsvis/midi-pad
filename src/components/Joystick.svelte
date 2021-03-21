<script lang="typescript">    
import nipplejs, {JoystickManagerOptions} from 'nipplejs';

var options: JoystickManagerOptions ={zone: document.getElementById('staticJs'),   mode: 'static',
        position: {left: '50%', top: '50%'},
        color: 'red'
    }
var staticJs = nipplejs.create(options);

</script>

<div id="staticjs">

   
</div>