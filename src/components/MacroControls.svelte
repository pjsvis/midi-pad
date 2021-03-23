<script lang="typescript">
 import Arrows from './Arrows.svelte'
 import {Button} from 'svelte-mui'
import MacroButton from './MacroButton.svelte' 


    let vals = [0,10,35,64,78,20,34,120]
    
    const btnStyle = 'ba b--blue bw2 b--solid br3 pa2 f6 shadow-5 dim w4 h4 bg-light-red mb3 mr3 pa2 pointer'
    const exBtnStyle = 'button-bare ' + btnStyle



    </script>
    
<div class="flex flex-column  cb mr2">

    <Button raised toggle="true" color="primary">Toggle</Button>
  <p>&nbsp;</p>  

<button class={exBtnStyle}>Test Button</button>

</div>

<!-- <div class="cb"><Arrows /></div> -->

<div class="cb">

    
    <div class="flex">        
        <MacroButton title="" cc={14} isDisabled={false} />
        <MacroButton title="" cc={15} isDisabled={true}/>
        <MacroButton title=""  cc={16}  isDisabled={true}/>
        <MacroButton title=""  cc={17}  isDisabled={true}/>
        <MacroButton title=""  cc={18}  isDisabled={true}/>
        <MacroButton title=""  cc={19}  isDisabled={true}/>
        <MacroButton title=""  cc={20}  isDisabled={true}/>
        <MacroButton title=""  cc={21}  isDisabled={true}/>
    </div>
    <div class="flex">        
        <div class={btnStyle}>CC22</div>
        <div class={btnStyle}>CC23</div>
        <div class={btnStyle}>CC24</div>
        <div class={btnStyle}>CC25</div>
        <div class={btnStyle}>CC26</div>
        <div class={btnStyle}>CC27</div>
        <div class={btnStyle}>CC28</div>
        <div class={btnStyle}>CC29</div>
    </div>
    <div class="flex">        
        <div class={btnStyle}>CC46</div>
        <div class={btnStyle}>CC47</div>
        <div class={btnStyle}>CC48</div>
        <div class={btnStyle}>CC49</div>
        <div class={btnStyle}>CC50</div>
        <div class={btnStyle}>CC51</div>
        <div class={btnStyle}>CC52</div>
        <div class={btnStyle}>CC53</div></div>
    <div class="flex">        
        <div class={btnStyle}>CC54</div>
        <div class={btnStyle}>CC55</div>
        <div class={btnStyle}>CC56</div>
        <div class={btnStyle}>CC57</div>
        <div class={btnStyle}>CC58</div>
        <div class={btnStyle}>CC59</div>
        <div class={btnStyle}>CC60</div>
        <div class={btnStyle}>CC61</div>
    </div>
        
    </div>
        


    
    <style>

.div:focus-within {
    border: thin solid black;
}

/*
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