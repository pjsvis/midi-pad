<script lang="typescript">

    </script>

<div class="slider-wrapper">
    <input type="range" min="0" max="11" value="7" step="1">
  </div>

    <style>
        .slider-wrapper {
  display: inline-block;
  width: 20px;
  height: 150px;
  padding: 0;
}

.slider-wrapper input {
  width: 150px;
  height: 20px;
  margin: 0;
  transform-origin: 75px 75px;
  transform: rotate(-90deg);
}
input[type='range']  {
		-webkit-appearance: none ;
		width:200px;
	}
	input[type='range']::-webkit-slider-runnable-track {
		-webkit-appearance: none ;
		appearance: none ;
		border-radius: 5px;
		box-shadow: inset 1px 1px 1px rgba(000,000,000,0.10);
		background-color: #CCC;
		height: 8px;
		vertical-align:middle;
		border: none;
		cursor: pointer;
	}
	input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		border-radius: 100%;
		background-color: #037cd5;
		box-shadow: inset 0 0 0 4px #CCC, inset 0 0 4px #CCC, inset 0 0 0 4px #CCC;
		height: 22px;
		width: 22px;
		vertical-align:middle;
		border: none;
		cursor: pointer;
		margin-top: -6px;
	}
	input[type='range']::-webkit-slider-thumb:hover { 
		background: #fdd921;
	}
	input[type='range']:active::-webkit-slider-thumb { 
		background: #fdd921; 
	}
	input[type='range']::-moz-range-track{
		-moz-appearance: none ;
		border-radius: 5px;
		box-shadow: inset 1px 1px 1px rgba(000,000,000,0.10);
		background-color: #CCC;
		height: 8px;
		vertical-align:middle;
		margin:0; padding:0;
		border: none;
		cursor: pointer; 
	}
	input[type='range']::-moz-range-thumb {
		-moz-appearance: none ;
		border-radius: 100%;
		background-color: #037cd5;
		box-shadow: inset 0 0 0 4px #CCC, inset 0 0 4px #CCC, inset 0 0 0 4px #CCC;
		height: 22px;
		width: 22px;
		vertical-align:middle;
		border: none;
		cursor: pointer;
		margin-top: -6px;
	}
	input[type='range']::-moz-range-thumb:hover { 
		background: #fdd921; 
	}
	input[type='range']:active::-moz-range-thumb { 
		background: #fdd921; 
	}
	input[type=range]::-ms-track {
		width: 100%;
		height: 8px;
		cursor: pointer;
		animate: 0.2s;
		background: transparent;
		border-color: transparent;
		border-width: 39px 0;
		color: transparent;
	}
	input[type=range]::-ms-fill-lower {
		background: #CCC;
		border: 0px solid #000101;
		border-radius: 50px;
		box-shadow: 0px 0px 0px #000000, 0px 0px 0px #0d0d0d;
	}
	input[type=range]::-ms-fill-upper {
		background: #CCC;
		border: 0px solid #000101;
		border-radius: 50px;
		box-shadow: 0px 0px 0px #000000, 0px 0px 0px #0d0d0d;
	}
	input[type=range]::-ms-thumb {
		box-shadow: inset 0 0 0 4px #CCC, inset 0 0 4px #CCC, inset 0 0 0 4px #CCC;
		border: 0px solid #000000;
		height: 22px;
		width: 22px;
		border-radius: 100%;
		background: #037cd5;
		cursor: pointer;
		margin-top: -2px;	
	}
    </style>