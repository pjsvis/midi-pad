<script lang="ts">
	import { onMount } from "svelte";
	import type { Input, Output } from "webmidi";
	import {
		isWebMidi,
		enableWebMidi,
		getInputs,
		getOutputs,
		playNote,
		sendCc,
		disableWebMidi,
	} from "../utilities/midi-utils";

	import WebMidi from "webmidi";
	import MacroControls from "./MacroControls.svelte";

	import { prevent_default, set_attributes } from "svelte/internal";
	import KeyTrap from "./KeyTrap.svelte";
	import XYPad from "./XYPad.svelte";
	import Checkbox from "./Checkbox.svelte";
	import SelectInput from "./SelectInput.svelte";
	import SelectOutput from "./SelectOutput.svelte";

	// Ref: https://www.geeksforgeeks.org/how-to-disable-scrolling-temporarily-using-javascript/
	// Poss use https://www.npmjs.com/package/quietwheel
	// function disableScroll() {
	//     document.body.classList.add("body.stop-scrolling");
	// }

	// function enableScroll() {
	//     document.body.classList.remove("body.stop-scrolling");
	// }

	// Handle mouse wheel scroll
	const handleWheel = (e: WheelEvent) => {
		// disableScroll()
		console.log(e);
		const x = e.clientX;
		const y = e.clientY;

		// What element are we scrolling
		let focussedEl = document.elementsFromPoint(x, y)[0];
		// let focussedEl = focussedEls[0]
		console.log("focussedEls", focussedEl);
		let isDataScroll = focussedEl.getAttribute("data-scroll") !== null;
		console.log("isDataScroll", isDataScroll);

		// Not scrollable input so exit
		if (!isDataScroll) {
			return;
		}

		// Get the cc to send to
		const cc = focussedEl.getAttribute("data-cc");
		console.log("focussedCC: ", cc);
		// var delta = Math.max(-1, Math.min(1, (e.deltaY || -e.detail)));
		const delta = e.deltaY || e.detail;
		// TODO: Stash inc in a store
		delta < 0 ? incCC14() : decCC14();

		// enableScroll()
	};

	onMount(async () => {
		// Capture mouse wheel
		window.onwheel = handleWheel;

		// Enable web midi
		console.log("enableWebMidi");
		await enableWebMidi().then(() => {
			console.log("getIo");
			handleShowIO();
		});

		isEnabled = true;
	});

	let isEnabled = false;
	let isNotEnabledStyle = "fa fa-times ml2 black";
	let isEnabledStyle = "fa fa-check ml2 black";
	$: inputs = [] as Input[];
	$: outputs = [] as Output[];

	function handleEnable() {
		const isSupported = isWebMidi();
		isSupported
			? console.log("WebMidi supported")
			: alert("WebMidi not supported");

		if (isSupported) {
			enableWebMidi();
			isEnabled = true;
		} else {
			return;
		}
	}

	const handleDisable = async () => {
		await disableWebMidi();
		isEnabled = false;
	};

	const handleShowIO = () => {
		inputs = getInputs();
		outputs = getOutputs();
	};

	const handleSendNotes = () => {
		const note = [42, 44, 46, 48, 50];
		const port = 6;
		playNote(port, note);
	};

	let cc14Val: number = 0.0;

	const fixCCValue = (val: number): number => {
		if (val > 127) {
			return 127;
		}
		if (val < 0) {
			return 0;
		}
		return val;
	};
	const incAmount = 5;
	const incCC14 = () => {
		cc14Val += incAmount;
		console.log("cc14Val inc", cc14Val);
		cc14Val = fixCCValue(cc14Val);
		console.log("cc14Val send", cc14Val);
		sendCc(8, 14, cc14Val);
	};

	const decCC14 = () => {
		cc14Val -= incAmount;
		console.log("cc14Val dec", cc14Val);
		cc14Val = fixCCValue(cc14Val);
		console.log("cc14Val send", cc14Val);
		sendCc(8, 14, cc14Val);
	};

	const handleSendCc = () => {
		const value = 127;
		const port = 8;
		const controller = 14;
		sendCc(port, controller, value);
	};

	const handleSetNrp = () => {
		const port = 8;
		const param = [0x62, 0x63];
		const data = [1, -5];
		//setNrp(port, param, data);
		WebMidi.outputs[port].setNonRegisteredParameter([0x62, 0x63], [1, 5]) 
	};

	const btnStyle =
		"flex ba b--black-10 pa2 f6 shadow-4 grow fit-w bg-light-red mb1 mr2 pa2 pointer";

	const selStyle = "f6 fit-w mr2 pointer";
</script>

<KeyTrap />

<div class="t1 t1-start bg-c-blue-100">
	<div class="flex">
		<div class={btnStyle} on:click={handleEnable}>
			Enable WebMidi XXX <i
				class={isEnabled ? isEnabledStyle : isNotEnabledStyle}
			/>
		</div>
		<div class={btnStyle} on:click={handleDisable}>
			Disable WebMidi <i
				class={isEnabled ? isEnabledStyle : isNotEnabledStyle}
			/>
		</div>
		<div class={btnStyle} on:click={handleShowIO}>Show I/O</div>
		<div class={btnStyle} on:click={handleSendNotes}>Send Notes</div>
		<div class={btnStyle} on:click={handleSendCc}>Send CC</div>
		<div class={btnStyle} on:click={handleSetNrp}>Set NRP</div>
		<div class={selStyle}><SelectInput {inputs} /></div>
		<div class={selStyle}><SelectOutput {outputs} /></div>
	</div>
</div>

<!-- Inputs and Outputs -->
<div class="flex mt2" />

<div class="flex">
	<!-- <div class="flex mt2 mr2">
		<XYPad />
	</div> -->

	<div class="flex">
		<Checkbox />
	</div>

	<div class="flex mt2">
		<MacroControls />
	</div>

</div>
<!-- <div class="t1 t1-start flex flex-col w-full p-8 ">
	<div class="t1 w-full flex flex-col w6:flex-row bg-c-white rounded-3 shadow-4 max-w-640">
		<div class="t1 w-full w6:w-160 pt-66% w6:pt-0 w6:min-h-100 relative">
				<div class="t1 absolute inset-0 rounded-t-3 w6:rounded-l-3 w6:rounded-tr-0 bg-c-blue"></div>
		</div>
		<div class="t1 flex-1 p-16 color-text">
				<div class="t1 font-20 font-weight-600 mb-4">Test Panel</div>
				<div class="t1 ">This panel uses TurboCSS to style the HTML contents of the panel. All in all this looks like a useful development beyond the Tachyons way of doing things.</div>
		</div>
</div> 
</div> -->

<style>
</style>
