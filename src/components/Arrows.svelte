<script lang="typescript">

const up = 'fa fa-chevron-up f1 fire'

const dn = 'fa fa-chevron-down f1 silver'

const lr = 'fa fa-chevron-left f1 silver'
const rl = 'fa fa-chevron-right f1 silver'




    </script>
<div class="flex flex-column bg-dark pa4">
<ul >
    <li>
      <a href={'#'}>
        <i class="fa fa-chevron-up"></i>        
      </a>
    </li>
    <li>
      <a href={'#'}>
        <i class="fa fa-chevron-down"></i>
      </a>
      </li>
    <li>
      <a href={'#'}>
        <i class="fa fa-chevron-left"></i>
      </a>
      
    </li>
    <li>
      <a href={'#'}>
          <i class="fa fa-chevron-right "></i>
        </a>
        
      </li>
    <li>
      <a href={'#'}>
        <i class="fa fa-edge"></i>
      </a> 
    </li>
  </ul>
</div>
    
<div class="flex flex-column bg-dark pa4">

   

    <i class={up} ></i>

<i class={dn} ></i>

<div class="flex flex-row">
<i class={lr} ></i>

<i class={rl} ></i>
</div>
</div>

<style>
.bg-dark{background-color: #333;}

/* Ref: https://codepen.io/dig-lopes/pen/WLVGda */
ul, .fire {
  margin: 0;
  padding: 0;
  display: flex;
}

ul li, .fire {
  list-style: none;
  margin: 0 15px;
}

ul li a, .fire {
  position: relative; 
  display: block;
  width: 60px;
  height: 60px;
  text-align: center;
  line-height: 63px;
  background: #333;
  border-radius: 50%;
  font-size: 30px;
  color: #666;
  transition: .5s;

}

ul li a::before, .fire::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #ffee10;
  transition: .5s;
  transform: scale(.9);
  z-index: -1;
}

ul li a:hover::before, .fire:hover::before {
  transform: scale(1.1);
  box-shadow: 0 0 15px #ffee10;
}

ul li a:hover, .fire:hover {
  color: #ffee10;
  box-shadow: 0 0 5px #ffee10;
  text-shadow: 0 0 5px #ffee10;
}

</style>