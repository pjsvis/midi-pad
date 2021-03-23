<script>
import jquery from 'jquery'

var rotate = 0;
var level  = 0;
var mx = Math.cos((210) * Math.PI / 180) * 98 + 100;
var my = Math.sin((210) * Math.PI / 180) * -98 + 100;

var limiter = function(value, lower, upper) {
  if(value < lower) return lower;
  else if(value > upper) return upper;
  else return value;
}

var log = function(msg) {
  jquery('#log').prepend('<p>' + msg + '</p>');
  jquery('#log p:gt(9)').remove();
}

jquery(document).ready(function() {
  jquery('#knob').on('DOMMouseScroll mousewheel', function(e) {
    e.preventDefault();
    log(e.originalEvent.deltaY);
    rotate += limiter(e.originalEvent.deltaY,-4,4);
    
    //snap only work with osx two finger swipe
    if(rotate > -4 && rotate < 4) rotate = 0;
    if(rotate >= 120) rotate = 120;
    if(rotate <= -120) rotate = -120; 
    
   jquery(this).css('transform','rotate(' + rotate + 'deg)');
    
    //level = 411 - ((rotate + 120) / 240 * 411);
    //jquery('#level').css('stroke-dashoffset',level);
    var x = Math.cos((90-rotate) * Math.PI / 180) * 98 + 100;
    var y = Math.sin((90-rotate) * Math.PI / 180) * -98 + 100;
    
    var largeArc = (rotate >= 60) ? 1 : 0;
    
    jquery('#level').find('path').attr('d','M ' + mx + ' ' + my + ' A 98 98 45, '+ largeArc + ', 1, ' + x + ' ' + y);
  });
});
    </script>
<svg height="200" id="level" width="200">
    <path d="M 15.12951042912502 149 A 98 98 45, 0, 1, 15.129510429125006 51.00000000000001" fill="none" stroke-width="4" stroke="#aaa"></path>
  </svg>

  <svg fill="none" height="200" id="knob" width="200" style="transform: rotate(-60deg);">
    <circle cx="100" cy="100" fill="#333" r="80" stroke-width="4" stroke="white"></circle>
    <circle cx="100" cy="35" fill="white" r="5" stroke-width="0" stroke="none"></circle>

  <circle cx="100" cy="100" fill="#333" r="80" stroke-width="4" stroke="white"></circle>
  <circle cx="100" cy="35" fill="white" r="5" stroke-width="0" stroke="none"></circle>

</svg>

<style>
 body {
  margin: 0;
  padding: 0;
}

#knob {
  margin: 50px;
  width: 200px;
  height: 200px;
  -webkit-transform: rotate(0deg);
}

#level {
  position: absolute;
  margin: 50px;
  width: 200px;
  height: 200px;
  top: 0;
  left: 0;
  /* #stroke-dasharray: 411; */
  /* #stroke-dashoffset: 205.5; */
}  
</style>