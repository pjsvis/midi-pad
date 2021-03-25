 // src/store/cars.js

 import { writable } from 'svelte/store';
import {initialMidipadConfig} from './midipad-config'

 const CARS = [
     { make: "Ford", model: "Taurus", year: "2015" },
     { make: "Toyota", model: "Avalon", year: "2013" }
 ];

 const macroStates = initialMidipadConfig.macroStates;



 const { subscribe, set, update } = writable(CARS);

//  const (subscribe, set, update) =writable(bank1)

 const addCar = car => update(cars => {
     return [...cars, car];
 });

 const reset = () => {
     set(CARS);
 };

 export default {
     subscribe,
     addCar,
     reset
 }