import { writable } from 'svelte/store';
import store from 'store2';
import { initialMidipadConfig } from './midipad-config';
// TODO: Use store2 namespaces to facilitate multiple configs
// TODO: Allow import/export of config json
const key = 'midipad';
const lsMidipadConfig = store(key);
const macroStates = lsMidipadConfig !== null ? lsMidipadConfig.macroStates : initialMidipadConfig.macroStates;
export const macroStatesStore = writable(macroStates);
macroStatesStore.subscribe((macroStates) => {
    const midipadConfig = Object.assign(Object.assign({}, lsMidipadConfig), macroStates);
    store(key, midipadConfig);
});
//# sourceMappingURL=midipad-store.js.map