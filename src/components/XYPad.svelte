<script type="typescript">
    import { onMount } from "svelte";
    import { prevent_default } from "svelte/internal";

    // Ref: https://zipso.net/a-simple-touchscreen-sketchpad-using-javascript-and-html5/

    // Variables for referencing the canvas and 2dcanvas context
    var canvas, ctx;

    // Variables to keep track of the mouse position and left-button status
    var mouseX,
        mouseY,
        mouseDown = 0;

    // Variables to keep track of the touch position
    var touchX, touchY;

    var r, g, b, a;
    // Draws a dot at a specific position on the supplied canvas name
    // Parameters are: A canvas context, the x position, the y position, the size of the dot
    // TODO: See https://codepen.io/falldowngoboone/pen/PwzPYv for mouse trails
    function drawDot(ctx, x, y, size) {
        // Let's use black by setting RGB values to 0, and 255 alpha (completely opaque)
        r = 0;
        g = 0;
        b = 0;
        a = 30;

        // Select a fill style
        ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + a / 255 + ")";

        // Draw a filled circle
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
    }

    // Clear the canvas context using the canvas width and height
    function clearCanvas(canvas, ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Keep track of the mouse button being pressed and draw a dot at current location
    function sketchpad_mouseDown() {
        mouseDown = 1;
        drawDot(ctx, mouseX, mouseY, 12);
    }

    // Keep track of the mouse button being released
    function sketchpad_mouseUp() {
        mouseDown = 0;
        clearCanvas(canvas, ctx);
        drawDot(ctx, mouseX, mouseY, 12);
    }

    // Keep track of the mouse position and draw a dot if mouse button is currently pressed
    function sketchpad_mouseMove(e) {
        // Update the mouse co-ordinates when moved
        getMousePos(e);

        // Draw a dot if the mouse button is currently being pressed
        if (mouseDown == 1) {
            drawDot(ctx, mouseX, mouseY, 12);
        }
    }

    // Get the current mouse position relative to the top-left of the canvas
    function getMousePos(e) {
        if (e.offsetX) {
            mouseX = e.offsetX;
            mouseY = e.offsetY;
        } else if (e.layerX) {
            mouseX = e.layerX;
            mouseY = e.layerY;
        }
    }

    // Draw something when a touch start is detected
    function sketchpad_touchStart(e) {
        // Update the touch co-ordinates
        getTouchPos(e);

        drawDot(ctx, touchX, touchY, 12);

        // Prevents an additional mousedown event being triggered
        e.preventDefault();
    }

    // Draw something and prevent the default scrolling when touch movement is detected
    function sketchpad_touchMove(e) {
        // Update the touch co-ordinates
        getTouchPos(e);

        // During a touchmove event, unlike a mousemove event, we don't need to check if the touch is engaged, since there will always be contact with the screen by definition.
        drawDot(ctx, touchX, touchY, 12);

        // Prevent a scrolling action as a result of this touchmove triggering.
        e.preventDefault();
    }

    // Get the touch position relative to the top-left of the canvas
    // When we get the raw values of pageX and pageY below, they take into account the scrolling on the page
    // but not the position relative to our target div. We'll adjust them using "target.offsetLeft" and
    // "target.offsetTop" to get the correct values in relation to the top left of the canvas.
    function getTouchPos(e) {
        if (e.touches) {
            if (e.touches.length == 1) {
                // Only deal with one finger
                var touch = e.touches[0]; // Get the information for finger #1
                touchX = touch.pageX - touch.target.offsetLeft;
                touchY = touch.pageY - touch.target.offsetTop;
            }
        }
    }

    // Set-up the canvas and add our event handlers after the page has loaded
    function init() {
        console.log("init");
        // Get the specific canvas element from the HTML document
        canvas = document.getElementById("sketchpad");

        // If the browser supports the canvas tag, get the 2d drawing context for this canvas
        if (canvas.getContext) ctx = canvas.getContext("2d");

        // Check that we have a valid context to draw on/with before adding event handlers
        if (ctx) {
            // React to mouse events on the canvas, and mouseup on the entire document
            canvas.addEventListener("mousedown", sketchpad_mouseDown, false);
            canvas.addEventListener("mousemove", sketchpad_mouseMove, false);
            window.addEventListener("mouseup", sketchpad_mouseUp, false);

            // React to touch events on the canvas
            canvas.addEventListener("touchstart", sketchpad_touchStart, false);
            canvas.addEventListener("touchmove", sketchpad_touchMove, false);
        }
    }
    onMount(() => {
        init();
    });
</script>

<div id="sketchpadapp">
    <!-- <div class="leftside">
         Touchscreen and mouse support HTML5 canvas sketchpad.<br/><br/>
         Draw something by tapping or dragging.<br/><br/>
         Works on iOS, Android and desktop/laptop touchscreens using Chrome/Firefox/Safari.<br/><br/>
        </div> -->
    <!-- <input type="submit" value="Clear Sketchpad" id="clearbutton" on:click={() => clearCanvas(canvas,ctx)}> -->
    <div class="rightside">
        <canvas id="sketchpad" height="300" width="400" />
    </div>
</div>

<div>
    <div id="xypad">
        <div class="header">
            <button id="xypad-cal" style="float:right">calibrate</button>
            <span id="xy">184, 106</span>
            <div>XY PAD</div>
        </div>
    </div>
</div>
<h1>hello</h1>
<div id="xy-conf" data-children-count="2">
    X:
    <select id="x-cc" style="background:transparent">
        <option value="cc-16">Filter freq</option>
        <option value="cc-82">Resonance</option>
        <option value="cc-85">Filter env</option>
        <option value="cc-17">Filter LFO 2</option>
        <option value="cc-94">Distortion</option>
        <option value="cc-115">Osc 2 filter mod</option>
        <option value="cc-86">LFO 1 delay</option>
        <option value="cc-18">LFO 1 speed</option>
        <option value="cc-87">LFO 2 delay</option>
        <option value="cc-19">LFO 2 speed</option>
        <option value="cc-27">Osc 1 coarse</option>
        <option value="cc-26">Osc 1 fine</option>
        <option value="cc-71">Osc 1 mod env</option>
        <option value="cc-28">Osc 1 mod LFO 1</option>
        <option value="cc-72">Osc 1 PWM env</option>
        <option value="cc-73">Osc 1 PWM LFO 2</option>
        <option value="cc-30">Osc 2 coarse</option>
        <option value="cc-29">Osc 2 fine</option>
        <option value="cc-76">Osc 2 mod env</option>
        <option value="cc-31">Osc 2 mod LFO 1</option>
        <option value="cc-77">Osc 2 PWM env</option>
        <option value="cc-78">Osc 2 PWM LFO 2</option>
        <option value="cc-22">Mix sub</option>
        <option value="cc-20">Mix osc 1</option>
        <option value="cc-21">Mix osc 2</option>
        <option value="cc-24">Mix ring</option>
        <option value="cc-23">Mix noise</option>
        <option value="cc-25">Mix ext</option>
        <option value="cc-102">Mod env attack</option>
        <option value="cc-103">Mod env decay</option>
        <option value="cc-104">Mod env sustain</option>
        <option value="cc-105">Mod env release</option>
        <option value="cc-90">Amp env attack</option>
        <option value="cc-91">Amp env decay</option>
        <option value="cc-92">Amp env sustain</option>
        <option value="cc-93">Amp env release</option>
    </select>
    Y:
    <select id="y-cc" style="background:transparent">
        <option value="cc-16">Filter freq</option>
        <option value="cc-82">Resonance</option>
        <option value="cc-85">Filter env</option>
        <option value="cc-17">Filter LFO 2</option>
        <option value="cc-94">Distortion</option>
        <option value="cc-115">Osc 2 filter mod</option>
        <option value="cc-86">LFO 1 delay</option>
        <option value="cc-18">LFO 1 speed</option>
        <option value="cc-87">LFO 2 delay</option>
        <option value="cc-19">LFO 2 speed</option>
        <option value="cc-27">Osc 1 coarse</option>
        <option value="cc-26">Osc 1 fine</option>
        <option value="cc-71">Osc 1 mod env</option>
        <option value="cc-28">Osc 1 mod LFO 1</option>
        <option value="cc-72">Osc 1 PWM env</option>
        <option value="cc-73">Osc 1 PWM LFO 2</option>
        <option value="cc-30">Osc 2 coarse</option>
        <option value="cc-29">Osc 2 fine</option>
        <option value="cc-76">Osc 2 mod env</option>
        <option value="cc-31">Osc 2 mod LFO 1</option>
        <option value="cc-77">Osc 2 PWM env</option>
        <option value="cc-78">Osc 2 PWM LFO 2</option>
        <option value="cc-22">Mix sub</option>
        <option value="cc-20">Mix osc 1</option>
        <option value="cc-21">Mix osc 2</option>
        <option value="cc-24">Mix ring</option>
        <option value="cc-23">Mix noise</option>
        <option value="cc-25">Mix ext</option>
        <option value="cc-102">Mod env attack</option>
        <option value="cc-103">Mod env decay</option>
        <option value="cc-104">Mod env sustain</option>
        <option value="cc-105">Mod env release</option>
        <option value="cc-90">Amp env attack</option>
        <option value="cc-91">Amp env decay</option>
        <option value="cc-92">Amp env sustain</option>
        <option value="cc-93">Amp env release</option>
    </select>
</div>

<div id="grid-container">
    <svg
        id="pad"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
    >
        <path
            d="M 0 50 L 100 50"
            stroke="#aaa"
            stroke-width="1px"
            vector-effect="non-scaling-stroke"
        />
        <path
            d="M 50 0 L 50 100"
            stroke="#aaa"
            stroke-width="1px"
            vector-effect="non-scaling-stroke"
        />
        <path
            d="M 0 0 L 100 100"
            stroke="#777"
            stroke-width="1px"
            vector-effect="non-scaling-stroke"
        />
        <path
            d="M 0 100 L 100 0"
            stroke="#777"
            stroke-width="1px"
            vector-effect="non-scaling-stroke"
        />
        <path
            d="M 25 0 L 25 100"
            stroke="#555"
            stroke-width="1px"
            vector-effect="non-scaling-stroke"
        />
        <path
            d="M 75 0 L 75 100"
            stroke="#555"
            stroke-width="1px"
            vector-effect="non-scaling-stroke"
        />
        <path
            d="M 0 25 L 100 25"
            stroke="#555"
            stroke-width="1px"
            vector-effect="non-scaling-stroke"
        />
        <path
            d="M 0 75 L 100 75"
            stroke="#555"
            stroke-width="1px"
            vector-effect="non-scaling-stroke"
        />
        <circle
            id="dot"
            cx="72.16082688682312"
            cy="16.355717350321783"
            r="5"
            fill-opacity="0.66"
        />
        <rect
            id="pad-zone"
            x="0"
            y="0"
            width="100"
            height="100"
            stroke-width="0"
            fill="#333"
            fill-opacity="0.25"
        />
    </svg>
</div>

<style>
    /* Some CSS styling */
    #sketchpadapp {
        /* Prevent nearby text being highlighted when accidentally dragging mouse outside confines of the canvas */
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }
    /* .leftside {
            float:left;
            width:220px;
            height:285px;
            background-color:#def;
            padding:10px;
            border-radius:4px;
        } */
    .rightside {
        float: left;
        margin-left: 10px;
    }
    #sketchpad {
        float: left;
        height: 300px;
        width: 400px;
        border: 2px solid #888;
        border-radius: 4px;
        position: relative; /* Necessary for correct mouse co-ords in Firefox */
        cursor: grab;
    }
    /* #clearbutton {
        font-size: 15px;
        padding: 10px;
        -webkit-appearance: none;
        background: #eee;
        border: 1px solid #888;
    } */
</style>
