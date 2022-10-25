# TODO

1. [] Add listener for joysticks
1. [x] Add button to enable Web Midi
1. [x] Add indicator to show enabled status
1. [x] Add joystick
1. [ ] Add midi player
1. [ ] Get deploy to Netlify working
1. [ ] Test on ChromeBook
1. [ ] [XML Parser](https://www.npmjs.com/package/fast-xml-parser)
## ui frameworks

- [frameworks](https://dev.to/plazarev/overview-of-svelte-ui-libraries-and-components-2ban)
- [carbon](https://carbon-svelte.vercel.app/)
- [attractions](https://illright.github.io/attractions/)
- [atoms](https://svelte-atoms.web.app)
- [daisy-ui](https://daisyui.com/)

- [radial range slider](https://codepen.io/_Sabine/pen/Gwywoj)

- onWheel
- what are we over
- is it wheelable
- Y inc/dec value & prevent default
- N carry on

## inc/dec macro

- setNonRegisteredParameter(param, data=[], channel=all, options={})

```javascript
  const param=[1,8]
  const macro = 1
  const inc = [1:127]
  const dec= [-1:-127]
  WebMidi.outputs[0].setNonRegisteredParameter(param, [macro, inc]);
```
