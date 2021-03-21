

<script>
    import {onMount} from 'svelte'

onMount(async () => {
    console.log('mounted')

})
    Ui.P1 = function() {

    };

    Ui.P1.prototype = Object.create(Ui.prototype);

    Ui.P1.prototype.createElement = function() {
    "use strict";
    Ui.prototype.createElement.apply(this, arguments);
    this.addComponent(new Ui.Pointer({
        type: 'Rect',
        pointerWidth: 3,
        pointerHeight: this.width / 5,
        offset: this.width / 2 - this.width / 3.3 - this.width / 10
    }));

    this.addComponent(new Ui.Scale(this.merge(this.options, {
        drawScale: false,
        drawDial: true,
        radius: this.width/2.6})));

    var circle = new Ui.El.Circle(this.width / 3.3, this.width / 2, this.height / 2);
    this.el.node.appendChild(circle.node);
    this.el.node.setAttribute("class", "p1");
    };

   

  </script>


Hello knob
<div >

    <input class="p1" type="range" min="0" max="127"
    data-width="100" 
    data-height="100" 
    data-angleOffset="220"
    data-angleRange="280"
>

</div>

<style>
.p1 rect {
  fill: #57C7B6;
}

.p1 g polygon {
  opacity: 1;
}

.p1 circle {
  fill: #256058;
  stroke: #57C7B6;
  stroke-width: 2;
  filter: url(#dropshadow);
}

.p1 text {
  font-size: 10px;
  fill: #57C7B6;
  font-family: sans-serif;
  font-weight: 300;
  -webkit-transition: all .1s ease-in-out;
}

.p1 text.active {
  font-size: 15px;
  -webkit-transition: all .3s ease-in-out;
}

</style>




  