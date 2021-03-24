import {writable } from 'svelte/store'
import store from 'store2'
import {initialMidipadConfig} from './midipad-config'
import type {MidipadConfig} from '../types/midi-pad-types'


// TODO: Figure out what we need the store to do
// Maybe just the currently active macros
// TODO: Use store2 namespaces to facilitate multiple configs
// TODO: Allow import/export of config json
const key: string = 'midipad'

const lsMidipadConfig = store(key) as MidipadConfig

const macroStates = lsMidipadConfig !== null ? lsMidipadConfig.macroStates : initialMidipadConfig.macroStates

export const macroStatesStore = writable(macroStates)

macroStatesStore.subscribe((macroStates)=> {
    const midipadConfig = {...lsMidipadConfig, ...macroStates}
    store(key, midipadConfig)
})



