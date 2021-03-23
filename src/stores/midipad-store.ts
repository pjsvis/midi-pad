import {writable } from 'svelte/store'
import store from 'store2'
import {initialMidipadConfig} from './midipad-config'


// TODO: Use store2 namespaces to facilitate multiple configs
// TODO: Allow import/export of config json
const key: string = 'midipad'

const lsMidipadConfig = store(key)

export const midipadStore = writable(lsMidipadConfig || initialMidipadConfig)

midipadStore.subscribe((value)=> store(key, value))

