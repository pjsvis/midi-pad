import WebMidi, { Input, Output } from 'webmidi'

export const isWebMidi = () => {
    return navigator["requestMIDIAccess"]
}

// TODO: Fix this so that it returns a bollean
export const enableWebMidi = () => {
let enabled=null;
    WebMidi.enable(function (err) {
        if (err) {  
            console.log('Not supported error: ',err)                  
        } else { 
            console.log('WebMidi enabled')                        
        }

    });
    return enabled;
}

export const getInputs = () => {
    // Viewing available inputs and outputs
    const inputs: Input[] = WebMidi.inputs
    return inputs;
}

export const getOutputs = () => {
    const outputs: Output[] = WebMidi.outputs
    return outputs

}