import WebMidi from 'webmidi';
const noop = () => { };
export const isWebMidi = () => {
    return navigator["requestMIDIAccess"];
};
// TODO: Fix this so that it returns a boolean
export const enableWebMidi = async () => {
    if (WebMidi.enabled) {
        return;
    }
    return WebMidi.enable();
};
export const disableWebMidi = async () => {
    if (WebMidi.enabled) {
        return;
    }
    return WebMidi.disable();
};
export const getInputs = () => {
    // Viewing available inputs and outputs
    const inputs = WebMidi.inputs;
    return inputs;
};
export const getOutputs = () => {
    const outputs = WebMidi.outputs;
    return outputs;
};
export const playNote = async (port, note) => {
    enableWebMidi().then(x => {
        console.log('playNote');
        WebMidi.outputs[port].playNote(note, 'all', { duration: 4000, velocity: 1 });
    });
};
export const sendCc = (port, controller, ccValue) => {
    enableWebMidi().then(x => {
        console.log('sendCc: ', ccValue);
        WebMidi.outputs[port].sendControlChange(controller, ccValue, 'all');
    });
};
export const incParam = (port, param, channel) => {
    WebMidi.outputs[port].incrementRegisteredParameter(param, channel);
};
export const decParam = (port, param, channel) => {
    WebMidi.outputs[port].decrementRegisteredParameter(param, channel);
};
//# sourceMappingURL=midi-utils.js.map