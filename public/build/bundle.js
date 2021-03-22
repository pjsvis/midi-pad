
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.35.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    /*

    WebMidi v2.5.2

    WebMidi.js helps you tame the Web MIDI API. Send and receive MIDI messages with ease. Control instruments with user-friendly functions (playNote, sendPitchBend, etc.). React to MIDI input with simple event listeners (noteon, pitchbend, controlchange, etc.).
    https://github.com/djipco/webmidi


    The MIT License (MIT)

    Copyright (c) 2015-2019, Jean-Philippe Côté

    Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
    associated documentation files (the "Software"), to deal in the Software without restriction,
    including without limitation the rights to use, copy, modify, merge, publish, distribute,
    sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all copies or substantial
    portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
    NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
    OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
    CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

    */

    var webmidi_min = createCommonjsModule(function (module) {
    !function(scope){function WebMidi(){if(WebMidi.prototype._singleton)throw new Error("WebMidi is a singleton, it cannot be instantiated directly.");(WebMidi.prototype._singleton=this)._inputs=[],this._outputs=[],this._userHandlers={},this._stateChangeQueue=[],this._processingStateChange=!1,this._midiInterfaceEvents=["connected","disconnected"],this._nrpnBuffer=[[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]],this._nrpnEventsEnabled=!0,this._nrpnTypes=["entry","increment","decrement"],this._notes=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"],this._semitones={C:0,D:2,E:4,F:5,G:7,A:9,B:11},Object.defineProperties(this,{MIDI_SYSTEM_MESSAGES:{value:{sysex:240,timecode:241,songposition:242,songselect:243,tuningrequest:246,sysexend:247,clock:248,start:250,continue:251,stop:252,activesensing:254,reset:255,midimessage:0,unknownsystemmessage:-1},writable:!1,enumerable:!0,configurable:!1},MIDI_CHANNEL_MESSAGES:{value:{noteoff:8,noteon:9,keyaftertouch:10,controlchange:11,channelmode:11,nrpn:11,programchange:12,channelaftertouch:13,pitchbend:14},writable:!1,enumerable:!0,configurable:!1},MIDI_REGISTERED_PARAMETER:{value:{pitchbendrange:[0,0],channelfinetuning:[0,1],channelcoarsetuning:[0,2],tuningprogram:[0,3],tuningbank:[0,4],modulationrange:[0,5],azimuthangle:[61,0],elevationangle:[61,1],gain:[61,2],distanceratio:[61,3],maximumdistance:[61,4],maximumdistancegain:[61,5],referencedistanceratio:[61,6],panspreadangle:[61,7],rollangle:[61,8]},writable:!1,enumerable:!0,configurable:!1},MIDI_CONTROL_CHANGE_MESSAGES:{value:{bankselectcoarse:0,modulationwheelcoarse:1,breathcontrollercoarse:2,footcontrollercoarse:4,portamentotimecoarse:5,dataentrycoarse:6,volumecoarse:7,balancecoarse:8,pancoarse:10,expressioncoarse:11,effectcontrol1coarse:12,effectcontrol2coarse:13,generalpurposeslider1:16,generalpurposeslider2:17,generalpurposeslider3:18,generalpurposeslider4:19,bankselectfine:32,modulationwheelfine:33,breathcontrollerfine:34,footcontrollerfine:36,portamentotimefine:37,dataentryfine:38,volumefine:39,balancefine:40,panfine:42,expressionfine:43,effectcontrol1fine:44,effectcontrol2fine:45,holdpedal:64,portamento:65,sustenutopedal:66,softpedal:67,legatopedal:68,hold2pedal:69,soundvariation:70,resonance:71,soundreleasetime:72,soundattacktime:73,brightness:74,soundcontrol6:75,soundcontrol7:76,soundcontrol8:77,soundcontrol9:78,soundcontrol10:79,generalpurposebutton1:80,generalpurposebutton2:81,generalpurposebutton3:82,generalpurposebutton4:83,reverblevel:91,tremololevel:92,choruslevel:93,celestelevel:94,phaserlevel:95,databuttonincrement:96,databuttondecrement:97,nonregisteredparametercoarse:98,nonregisteredparameterfine:99,registeredparametercoarse:100,registeredparameterfine:101},writable:!1,enumerable:!0,configurable:!1},MIDI_NRPN_MESSAGES:{value:{entrymsb:6,entrylsb:38,increment:96,decrement:97,paramlsb:98,parammsb:99,nullactiveparameter:127},writable:!1,enumerable:!0,configurable:!1},MIDI_CHANNEL_MODE_MESSAGES:{value:{allsoundoff:120,resetallcontrollers:121,localcontrol:122,allnotesoff:123,omnimodeoff:124,omnimodeon:125,monomodeon:126,polymodeon:127},writable:!1,enumerable:!0,configurable:!1},octaveOffset:{value:0,writable:!0,enumerable:!0,configurable:!1}}),Object.defineProperties(this,{supported:{enumerable:!0,get:function(){return "requestMIDIAccess"in navigator}},enabled:{enumerable:!0,get:function(){return void 0!==this.interface}.bind(this)},inputs:{enumerable:!0,get:function(){return this._inputs}.bind(this)},outputs:{enumerable:!0,get:function(){return this._outputs}.bind(this)},sysexEnabled:{enumerable:!0,get:function(){return !(!this.interface||!this.interface.sysexEnabled)}.bind(this)},nrpnEventsEnabled:{enumerable:!0,get:function(){return !!this._nrpnEventsEnabled}.bind(this),set:function(enabled){return this._nrpnEventsEnabled=enabled,this._nrpnEventsEnabled}},nrpnTypes:{enumerable:!0,get:function(){return this._nrpnTypes}.bind(this)},time:{enumerable:!0,get:function(){return performance.now()}}});}var wm=new WebMidi;function Input(midiInput){var that=this;this._userHandlers={channel:{},system:{}},this._midiInput=midiInput,Object.defineProperties(this,{connection:{enumerable:!0,get:function(){return that._midiInput.connection}},id:{enumerable:!0,get:function(){return that._midiInput.id}},manufacturer:{enumerable:!0,get:function(){return that._midiInput.manufacturer}},name:{enumerable:!0,get:function(){return that._midiInput.name}},state:{enumerable:!0,get:function(){return that._midiInput.state}},type:{enumerable:!0,get:function(){return that._midiInput.type}}}),this._initializeUserHandlers(),this._midiInput.onmidimessage=this._onMidiMessage.bind(this);}function Output(midiOutput){var that=this;this._midiOutput=midiOutput,Object.defineProperties(this,{connection:{enumerable:!0,get:function(){return that._midiOutput.connection}},id:{enumerable:!0,get:function(){return that._midiOutput.id}},manufacturer:{enumerable:!0,get:function(){return that._midiOutput.manufacturer}},name:{enumerable:!0,get:function(){return that._midiOutput.name}},state:{enumerable:!0,get:function(){return that._midiOutput.state}},type:{enumerable:!0,get:function(){return that._midiOutput.type}}});}WebMidi.prototype.enable=function(callback,sysex){this.enabled||(this.supported?navigator.requestMIDIAccess({sysex:sysex}).then(function(midiAccess){var promiseTimeout,events=[],promises=[];this.interface=midiAccess,this._resetInterfaceUserHandlers(),this.interface.onstatechange=function(e){events.push(e);};for(var inputs=midiAccess.inputs.values(),input=inputs.next();input&&!input.done;input=inputs.next())promises.push(input.value.open());for(var outputs=midiAccess.outputs.values(),output=outputs.next();output&&!output.done;output=outputs.next())promises.push(output.value.open());function onPortsOpen(){clearTimeout(promiseTimeout),this._updateInputsAndOutputs(),this.interface.onstatechange=this._onInterfaceStateChange.bind(this),"function"==typeof callback&&callback.call(this),events.forEach(function(event){this._onInterfaceStateChange(event);}.bind(this));}promiseTimeout=setTimeout(onPortsOpen.bind(this),200),Promise&&Promise.all(promises).catch(function(err){}).then(onPortsOpen.bind(this));}.bind(this),function(err){"function"==typeof callback&&callback.call(this,err);}.bind(this)):"function"==typeof callback&&callback(new Error("The Web MIDI API is not supported by your browser.")));},WebMidi.prototype.disable=function(){if(!this.supported)throw new Error("The Web MIDI API is not supported by your browser.");this.enabled&&(this.removeListener(),this.inputs.forEach(function(input){input.removeListener();})),this.interface&&(this.interface.onstatechange=void 0),this.interface=void 0,this._inputs=[],this._outputs=[],this._nrpnEventsEnabled=!0,this._resetInterfaceUserHandlers();},WebMidi.prototype.addListener=function(type,listener){if(!this.enabled)throw new Error("WebMidi must be enabled before adding event listeners.");if("function"!=typeof listener)throw new TypeError("The 'listener' parameter must be a function.");if(!(0<=this._midiInterfaceEvents.indexOf(type)))throw new TypeError("The specified event type is not supported.");return this._userHandlers[type].push(listener),this},WebMidi.prototype.hasListener=function(type,listener){if(!this.enabled)throw new Error("WebMidi must be enabled before checking event listeners.");if("function"!=typeof listener)throw new TypeError("The 'listener' parameter must be a function.");if(!(0<=this._midiInterfaceEvents.indexOf(type)))throw new TypeError("The specified event type is not supported.");for(var o=0;o<this._userHandlers[type].length;o++)if(this._userHandlers[type][o]===listener)return !0;return !1},WebMidi.prototype.removeListener=function(type,listener){if(!this.enabled)throw new Error("WebMidi must be enabled before removing event listeners.");if(void 0!==listener&&"function"!=typeof listener)throw new TypeError("The 'listener' parameter must be a function.");if(0<=this._midiInterfaceEvents.indexOf(type))if(listener)for(var o=0;o<this._userHandlers[type].length;o++)this._userHandlers[type][o]===listener&&this._userHandlers[type].splice(o,1);else this._userHandlers[type]=[];else {if(void 0!==type)throw new TypeError("The specified event type is not supported.");this._resetInterfaceUserHandlers();}return this},WebMidi.prototype.toMIDIChannels=function(channel){var channels;if("all"===channel||void 0===channel)channels=["all"];else {if("none"===channel)return channels=[];channels=Array.isArray(channel)?channel:[channel];}return -1<channels.indexOf("all")&&(channels=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]),channels.map(function(ch){return parseInt(ch)}).filter(function(ch){return 1<=ch&&ch<=16})},WebMidi.prototype.getInputById=function(id){if(!this.enabled)throw new Error("WebMidi is not enabled.");id=String(id);for(var i=0;i<this.inputs.length;i++)if(this.inputs[i].id===id)return this.inputs[i];return !1},WebMidi.prototype.getOutputById=function(id){if(!this.enabled)throw new Error("WebMidi is not enabled.");id=String(id);for(var i=0;i<this.outputs.length;i++)if(this.outputs[i].id===id)return this.outputs[i];return !1},WebMidi.prototype.getInputByName=function(name){if(!this.enabled)throw new Error("WebMidi is not enabled.");for(var i=0;i<this.inputs.length;i++)if(~this.inputs[i].name.indexOf(name))return this.inputs[i];return !1},WebMidi.prototype.getOctave=function(number){if(null!=number&&0<=number&&number<=127)return Math.floor(Math.floor(number)/12-1)+Math.floor(wm.octaveOffset)},WebMidi.prototype.getOutputByName=function(name){if(!this.enabled)throw new Error("WebMidi is not enabled.");for(var i=0;i<this.outputs.length;i++)if(~this.outputs[i].name.indexOf(name))return this.outputs[i];return !1},WebMidi.prototype.guessNoteNumber=function(input){var output=!1;if(input&&input.toFixed&&0<=input&&input<=127?output=Math.round(input):0<=parseInt(input)&&parseInt(input)<=127?output=parseInt(input):("string"==typeof input||input instanceof String)&&(output=this.noteNameToNumber(input)),!1===output)throw new Error("Invalid input value ("+input+").");return output},WebMidi.prototype.noteNameToNumber=function(name){"string"!=typeof name&&(name="");var matches=name.match(/([CDEFGAB])(#{0,2}|b{0,2})(-?\d+)/i);if(!matches)throw new RangeError("Invalid note name.");var semitones=wm._semitones[matches[1].toUpperCase()],result=12*(parseInt(matches[3])+1-Math.floor(wm.octaveOffset))+semitones;if(-1<matches[2].toLowerCase().indexOf("b")?result-=matches[2].length:-1<matches[2].toLowerCase().indexOf("#")&&(result+=matches[2].length),result<0||127<result)throw new RangeError("Invalid note name or note outside valid range.");return result},WebMidi.prototype._updateInputsAndOutputs=function(){this._updateInputs(),this._updateOutputs();},WebMidi.prototype._updateInputs=function(){for(var i=0;i<this._inputs.length;i++){for(var remove=!0,updated=this.interface.inputs.values(),input=updated.next();input&&!input.done;input=updated.next())if(this._inputs[i]._midiInput===input.value){remove=!1;break}remove&&this._inputs.splice(i,1);}this.interface&&this.interface.inputs.forEach(function(nInput){for(var add=!0,j=0;j<this._inputs.length;j++)this._inputs[j]._midiInput===nInput&&(add=!1);add&&this._inputs.push(new Input(nInput));}.bind(this));},WebMidi.prototype._updateOutputs=function(){for(var i=0;i<this._outputs.length;i++){for(var remove=!0,updated=this.interface.outputs.values(),output=updated.next();output&&!output.done;output=updated.next())if(this._outputs[i]._midiOutput===output.value){remove=!1;break}remove&&this._outputs.splice(i,1);}this.interface&&this.interface.outputs.forEach(function(nOutput){for(var add=!0,j=0;j<this._outputs.length;j++)this._outputs[j]._midiOutput===nOutput&&(add=!1);add&&this._outputs.push(new Output(nOutput));}.bind(this));},WebMidi.prototype._onInterfaceStateChange=function(e){this._updateInputsAndOutputs();var event={timestamp:e.timeStamp,type:e.port.state};this.interface&&"connected"===e.port.state?"output"===e.port.type?event.port=this.getOutputById(e.port.id):"input"===e.port.type&&(event.port=this.getInputById(e.port.id)):event.port={connection:"closed",id:e.port.id,manufacturer:e.port.manufacturer,name:e.port.name,state:e.port.state,type:e.port.type},this._userHandlers[e.port.state].forEach(function(handler){handler(event);});},WebMidi.prototype._resetInterfaceUserHandlers=function(){for(var i=0;i<this._midiInterfaceEvents.length;i++)this._userHandlers[this._midiInterfaceEvents[i]]=[];},Input.prototype.on=Input.prototype.addListener=function(type,channel,listener){var that=this;if(void 0===channel&&(channel="all"),Array.isArray(channel)||(channel=[channel]),channel.forEach(function(item){if("all"!==item&&!(1<=item&&item<=16))throw new RangeError("The 'channel' parameter is invalid.")}),"function"!=typeof listener)throw new TypeError("The 'listener' parameter must be a function.");if(void 0!==wm.MIDI_SYSTEM_MESSAGES[type])this._userHandlers.system[type]||(this._userHandlers.system[type]=[]),this._userHandlers.system[type].push(listener);else {if(void 0===wm.MIDI_CHANNEL_MESSAGES[type])throw new TypeError("The specified event type is not supported.");if(-1<channel.indexOf("all")){channel=[];for(var j=1;j<=16;j++)channel.push(j);}this._userHandlers.channel[type]||(this._userHandlers.channel[type]=[]),channel.forEach(function(ch){that._userHandlers.channel[type][ch]||(that._userHandlers.channel[type][ch]=[]),that._userHandlers.channel[type][ch].push(listener);});}return this},Input.prototype.hasListener=function(type,channel,listener){var that=this;if("function"!=typeof listener)throw new TypeError("The 'listener' parameter must be a function.");if(void 0===channel&&(channel="all"),channel.constructor!==Array&&(channel=[channel]),void 0!==wm.MIDI_SYSTEM_MESSAGES[type]){for(var o=0;o<this._userHandlers.system[type].length;o++)if(this._userHandlers.system[type][o]===listener)return !0}else if(void 0!==wm.MIDI_CHANNEL_MESSAGES[type]){if(-1<channel.indexOf("all")){channel=[];for(var j=1;j<=16;j++)channel.push(j);}return !!this._userHandlers.channel[type]&&channel.every(function(chNum){var listeners=that._userHandlers.channel[type][chNum];return listeners&&-1<listeners.indexOf(listener)})}return !1},Input.prototype.removeListener=function(type,channel,listener){var that=this;if(void 0!==listener&&"function"!=typeof listener)throw new TypeError("The 'listener' parameter must be a function.");if(void 0===channel&&(channel="all"),channel.constructor!==Array&&(channel=[channel]),void 0!==wm.MIDI_SYSTEM_MESSAGES[type])if(void 0===listener)this._userHandlers.system[type]=[];else for(var o=0;o<this._userHandlers.system[type].length;o++)this._userHandlers.system[type][o]===listener&&this._userHandlers.system[type].splice(o,1);else if(void 0!==wm.MIDI_CHANNEL_MESSAGES[type]){if(-1<channel.indexOf("all")){channel=[];for(var j=1;j<=16;j++)channel.push(j);}if(!this._userHandlers.channel[type])return this;channel.forEach(function(chNum){var listeners=that._userHandlers.channel[type][chNum];if(listeners)if(void 0===listener)that._userHandlers.channel[type][chNum]=[];else for(var l=0;l<listeners.length;l++)listeners[l]===listener&&listeners.splice(l,1);});}else {if(void 0!==type)throw new TypeError("The specified event type is not supported.");this._initializeUserHandlers();}return this},Input.prototype._initializeUserHandlers=function(){for(var prop1 in wm.MIDI_CHANNEL_MESSAGES)Object.prototype.hasOwnProperty.call(wm.MIDI_CHANNEL_MESSAGES,prop1)&&(this._userHandlers.channel[prop1]={});for(var prop2 in wm.MIDI_SYSTEM_MESSAGES)Object.prototype.hasOwnProperty.call(wm.MIDI_SYSTEM_MESSAGES,prop2)&&(this._userHandlers.system[prop2]=[]);},Input.prototype._onMidiMessage=function(e){if(0<this._userHandlers.system.midimessage.length){var event={target:this,data:e.data,timestamp:e.timeStamp,type:"midimessage"};this._userHandlers.system.midimessage.forEach(function(callback){callback(event);});}e.data[0]<240?(this._parseChannelEvent(e),this._parseNrpnEvent(e)):e.data[0]<=255&&this._parseSystemEvent(e);},Input.prototype._parseNrpnEvent=function(e){var data1,data2,command=e.data[0]>>4,channelBufferIndex=15&e.data[0],channel=1+channelBufferIndex;if(1<e.data.length&&(data1=e.data[1],data2=2<e.data.length?e.data[2]:void 0),wm.nrpnEventsEnabled&&command===wm.MIDI_CHANNEL_MESSAGES.controlchange&&(data1>=wm.MIDI_NRPN_MESSAGES.increment&&data1<=wm.MIDI_NRPN_MESSAGES.parammsb||data1===wm.MIDI_NRPN_MESSAGES.entrymsb||data1===wm.MIDI_NRPN_MESSAGES.entrylsb)){var ccEvent={target:this,type:"controlchange",data:e.data,timestamp:e.timeStamp,channel:channel,controller:{number:data1,name:this.getCcNameByNumber(data1)},value:data2};if(ccEvent.controller.number===wm.MIDI_NRPN_MESSAGES.parammsb&&ccEvent.value!=wm.MIDI_NRPN_MESSAGES.nullactiveparameter)wm._nrpnBuffer[channelBufferIndex]=[],wm._nrpnBuffer[channelBufferIndex][0]=ccEvent;else if(1===wm._nrpnBuffer[channelBufferIndex].length&&ccEvent.controller.number===wm.MIDI_NRPN_MESSAGES.paramlsb)wm._nrpnBuffer[channelBufferIndex].push(ccEvent);else if(2!==wm._nrpnBuffer[channelBufferIndex].length||ccEvent.controller.number!==wm.MIDI_NRPN_MESSAGES.increment&&ccEvent.controller.number!==wm.MIDI_NRPN_MESSAGES.decrement&&ccEvent.controller.number!==wm.MIDI_NRPN_MESSAGES.entrymsb)if(3===wm._nrpnBuffer[channelBufferIndex].length&&wm._nrpnBuffer[channelBufferIndex][2].number===wm.MIDI_NRPN_MESSAGES.entrymsb&&ccEvent.controller.number===wm.MIDI_NRPN_MESSAGES.entrylsb)wm._nrpnBuffer[channelBufferIndex].push(ccEvent);else if(3<=wm._nrpnBuffer[channelBufferIndex].length&&wm._nrpnBuffer[channelBufferIndex].length<=4&&ccEvent.controller.number===wm.MIDI_NRPN_MESSAGES.parammsb&&ccEvent.value===wm.MIDI_NRPN_MESSAGES.nullactiveparameter)wm._nrpnBuffer[channelBufferIndex].push(ccEvent);else if(4<=wm._nrpnBuffer[channelBufferIndex].length&&wm._nrpnBuffer[channelBufferIndex].length<=5&&ccEvent.controller.number===wm.MIDI_NRPN_MESSAGES.paramlsb&&ccEvent.value===wm.MIDI_NRPN_MESSAGES.nullactiveparameter){wm._nrpnBuffer[channelBufferIndex].push(ccEvent);var rawData=[];wm._nrpnBuffer[channelBufferIndex].forEach(function(ev){rawData.push(ev.data);});var nrpnNumber=wm._nrpnBuffer[channelBufferIndex][0].value<<7|wm._nrpnBuffer[channelBufferIndex][1].value,nrpnValue=wm._nrpnBuffer[channelBufferIndex][2].value;6===wm._nrpnBuffer[channelBufferIndex].length&&(nrpnValue=wm._nrpnBuffer[channelBufferIndex][2].value<<7|wm._nrpnBuffer[channelBufferIndex][3].value);var nrpnControllerType="";switch(wm._nrpnBuffer[channelBufferIndex][2].controller.number){case wm.MIDI_NRPN_MESSAGES.entrymsb:nrpnControllerType=wm._nrpnTypes[0];break;case wm.MIDI_NRPN_MESSAGES.increment:nrpnControllerType=wm._nrpnTypes[1];break;case wm.MIDI_NRPN_MESSAGES.decrement:nrpnControllerType=wm._nrpnTypes[2];break;default:throw new Error("The NPRN type was unidentifiable.")}var nrpnEvent={timestamp:ccEvent.timestamp,channel:ccEvent.channel,type:"nrpn",data:rawData,controller:{number:nrpnNumber,type:nrpnControllerType,name:"Non-Registered Parameter "+nrpnNumber},value:nrpnValue};wm._nrpnBuffer[channelBufferIndex]=[],this._userHandlers.channel[nrpnEvent.type]&&this._userHandlers.channel[nrpnEvent.type][nrpnEvent.channel]&&this._userHandlers.channel[nrpnEvent.type][nrpnEvent.channel].forEach(function(callback){callback(nrpnEvent);});}else wm._nrpnBuffer[channelBufferIndex]=[];else wm._nrpnBuffer[channelBufferIndex].push(ccEvent);}},Input.prototype._parseChannelEvent=function(e){var data1,data2,command=e.data[0]>>4,channel=1+(15&e.data[0]);1<e.data.length&&(data1=e.data[1],data2=2<e.data.length?e.data[2]:void 0);var event={target:this,data:e.data,timestamp:e.timeStamp,channel:channel};command===wm.MIDI_CHANNEL_MESSAGES.noteoff||command===wm.MIDI_CHANNEL_MESSAGES.noteon&&0===data2?(event.type="noteoff",event.note={number:data1,name:wm._notes[data1%12],octave:wm.getOctave(data1)},event.velocity=data2/127,event.rawVelocity=data2):command===wm.MIDI_CHANNEL_MESSAGES.noteon?(event.type="noteon",event.note={number:data1,name:wm._notes[data1%12],octave:wm.getOctave(data1)},event.velocity=data2/127,event.rawVelocity=data2):command===wm.MIDI_CHANNEL_MESSAGES.keyaftertouch?(event.type="keyaftertouch",event.note={number:data1,name:wm._notes[data1%12],octave:wm.getOctave(data1)},event.value=data2/127):command===wm.MIDI_CHANNEL_MESSAGES.controlchange&&0<=data1&&data1<=119?(event.type="controlchange",event.controller={number:data1,name:this.getCcNameByNumber(data1)},event.value=data2):command===wm.MIDI_CHANNEL_MESSAGES.channelmode&&120<=data1&&data1<=127?(event.type="channelmode",event.controller={number:data1,name:this.getChannelModeByNumber(data1)},event.value=data2):command===wm.MIDI_CHANNEL_MESSAGES.programchange?(event.type="programchange",event.value=data1):command===wm.MIDI_CHANNEL_MESSAGES.channelaftertouch?(event.type="channelaftertouch",event.value=data1/127):command===wm.MIDI_CHANNEL_MESSAGES.pitchbend?(event.type="pitchbend",event.value=((data2<<7)+data1-8192)/8192):event.type="unknownchannelmessage",this._userHandlers.channel[event.type]&&this._userHandlers.channel[event.type][channel]&&this._userHandlers.channel[event.type][channel].forEach(function(callback){callback(event);});},Input.prototype.getCcNameByNumber=function(number){if(!(0<=(number=Math.floor(number))&&number<=119))throw new RangeError("The control change number must be between 0 and 119.");for(var cc in wm.MIDI_CONTROL_CHANGE_MESSAGES)if(Object.prototype.hasOwnProperty.call(wm.MIDI_CONTROL_CHANGE_MESSAGES,cc)&&number===wm.MIDI_CONTROL_CHANGE_MESSAGES[cc])return cc},Input.prototype.getChannelModeByNumber=function(number){if(!(120<=(number=Math.floor(number))&&status<=127))throw new RangeError("The control change number must be between 120 and 127.");for(var cm in wm.MIDI_CHANNEL_MODE_MESSAGES)if(Object.prototype.hasOwnProperty.call(wm.MIDI_CHANNEL_MODE_MESSAGES,cm)&&number===wm.MIDI_CHANNEL_MODE_MESSAGES[cm])return cm},Input.prototype._parseSystemEvent=function(e){var command=e.data[0],event={target:this,data:e.data,timestamp:e.timeStamp};command===wm.MIDI_SYSTEM_MESSAGES.sysex?event.type="sysex":command===wm.MIDI_SYSTEM_MESSAGES.timecode?event.type="timecode":command===wm.MIDI_SYSTEM_MESSAGES.songposition?event.type="songposition":command===wm.MIDI_SYSTEM_MESSAGES.songselect?(event.type="songselect",event.song=e.data[1]):command===wm.MIDI_SYSTEM_MESSAGES.tuningrequest?event.type="tuningrequest":command===wm.MIDI_SYSTEM_MESSAGES.clock?event.type="clock":command===wm.MIDI_SYSTEM_MESSAGES.start?event.type="start":command===wm.MIDI_SYSTEM_MESSAGES.continue?event.type="continue":command===wm.MIDI_SYSTEM_MESSAGES.stop?event.type="stop":command===wm.MIDI_SYSTEM_MESSAGES.activesensing?event.type="activesensing":command===wm.MIDI_SYSTEM_MESSAGES.reset?event.type="reset":event.type="unknownsystemmessage",this._userHandlers.system[event.type]&&this._userHandlers.system[event.type].forEach(function(callback){callback(event);});},Output.prototype.send=function(status,data,timestamp){if(!(128<=status&&status<=255))throw new RangeError("The status byte must be an integer between 128 (0x80) and 255 (0xFF).");void 0===data&&(data=[]),Array.isArray(data)||(data=[data]);var message=[];return data.forEach(function(item){var parsed=Math.floor(item);if(!(0<=parsed&&parsed<=255))throw new RangeError("Data bytes must be integers between 0 (0x00) and 255 (0xFF).");message.push(parsed);}),this._midiOutput.send([status].concat(message),parseFloat(timestamp)||0),this},Output.prototype.sendSysex=function(manufacturer,data,options){if(!wm.sysexEnabled)throw new Error("Sysex message support must first be activated.");return options=options||{},manufacturer=[].concat(manufacturer),data.forEach(function(item){if(item<0||127<item)throw new RangeError("The data bytes of a sysex message must be integers between 0 (0x00) and 127 (0x7F).")}),data=manufacturer.concat(data,wm.MIDI_SYSTEM_MESSAGES.sysexend),this.send(wm.MIDI_SYSTEM_MESSAGES.sysex,data,this._parseTimeParameter(options.time)),this},Output.prototype.sendTimecodeQuarterFrame=function(value,options){return options=options||{},this.send(wm.MIDI_SYSTEM_MESSAGES.timecode,value,this._parseTimeParameter(options.time)),this},Output.prototype.sendSongPosition=function(value,options){options=options||{};var msb=(value=Math.floor(value)||0)>>7&127,lsb=127&value;return this.send(wm.MIDI_SYSTEM_MESSAGES.songposition,[msb,lsb],this._parseTimeParameter(options.time)),this},Output.prototype.sendSongSelect=function(value,options){if(options=options||{},!(0<=(value=Math.floor(value))&&value<=127))throw new RangeError("The song number must be between 0 and 127.");return this.send(wm.MIDI_SYSTEM_MESSAGES.songselect,[value],this._parseTimeParameter(options.time)),this},Output.prototype.sendTuningRequest=function(options){return options=options||{},this.send(wm.MIDI_SYSTEM_MESSAGES.tuningrequest,void 0,this._parseTimeParameter(options.time)),this},Output.prototype.sendClock=function(options){return options=options||{},this.send(wm.MIDI_SYSTEM_MESSAGES.clock,void 0,this._parseTimeParameter(options.time)),this},Output.prototype.sendStart=function(options){return options=options||{},this.send(wm.MIDI_SYSTEM_MESSAGES.start,void 0,this._parseTimeParameter(options.time)),this},Output.prototype.sendContinue=function(options){return options=options||{},this.send(wm.MIDI_SYSTEM_MESSAGES.continue,void 0,this._parseTimeParameter(options.time)),this},Output.prototype.sendStop=function(options){return options=options||{},this.send(wm.MIDI_SYSTEM_MESSAGES.stop,void 0,this._parseTimeParameter(options.time)),this},Output.prototype.sendActiveSensing=function(options){return options=options||{},this.send(wm.MIDI_SYSTEM_MESSAGES.activesensing,[],this._parseTimeParameter(options.time)),this},Output.prototype.sendReset=function(options){return options=options||{},this.send(wm.MIDI_SYSTEM_MESSAGES.reset,void 0,this._parseTimeParameter(options.time)),this},Output.prototype.stopNote=function(note,channel,options){if("all"===note)return this.sendChannelMode("allnotesoff",0,channel,options);var nVelocity=64;return (options=options||{}).rawVelocity?!isNaN(options.velocity)&&0<=options.velocity&&options.velocity<=127&&(nVelocity=options.velocity):!isNaN(options.velocity)&&0<=options.velocity&&options.velocity<=1&&(nVelocity=127*options.velocity),this._convertNoteToArray(note).forEach(function(item){wm.toMIDIChannels(channel).forEach(function(ch){this.send((wm.MIDI_CHANNEL_MESSAGES.noteoff<<4)+(ch-1),[item,Math.round(nVelocity)],this._parseTimeParameter(options.time));}.bind(this));}.bind(this)),this},Output.prototype.playNote=function(note,channel,options){var time,nVelocity=64;if((options=options||{}).rawVelocity?!isNaN(options.velocity)&&0<=options.velocity&&options.velocity<=127&&(nVelocity=options.velocity):!isNaN(options.velocity)&&0<=options.velocity&&options.velocity<=1&&(nVelocity=127*options.velocity),time=this._parseTimeParameter(options.time),this._convertNoteToArray(note).forEach(function(item){wm.toMIDIChannels(channel).forEach(function(ch){this.send((wm.MIDI_CHANNEL_MESSAGES.noteon<<4)+(ch-1),[item,Math.round(nVelocity)],time);}.bind(this));}.bind(this)),!isNaN(options.duration)){options.duration<=0&&(options.duration=0);var nRelease=64;options.rawVelocity?!isNaN(options.release)&&0<=options.release&&options.release<=127&&(nRelease=options.release):!isNaN(options.release)&&0<=options.release&&options.release<=1&&(nRelease=127*options.release),this._convertNoteToArray(note).forEach(function(item){wm.toMIDIChannels(channel).forEach(function(ch){this.send((wm.MIDI_CHANNEL_MESSAGES.noteoff<<4)+(ch-1),[item,Math.round(nRelease)],(time||wm.time)+options.duration);}.bind(this));}.bind(this));}return this},Output.prototype.sendKeyAftertouch=function(note,channel,pressure,options){var that=this;if(options=options||{},channel<1||16<channel)throw new RangeError("The channel must be between 1 and 16.");(isNaN(pressure)||pressure<0||1<pressure)&&(pressure=.5);var nPressure=Math.round(127*pressure);return this._convertNoteToArray(note).forEach(function(item){wm.toMIDIChannels(channel).forEach(function(ch){that.send((wm.MIDI_CHANNEL_MESSAGES.keyaftertouch<<4)+(ch-1),[item,nPressure],that._parseTimeParameter(options.time));});}),this},Output.prototype.sendControlChange=function(controller,value,channel,options){if(options=options||{},"string"==typeof controller){if(void 0===(controller=wm.MIDI_CONTROL_CHANGE_MESSAGES[controller]))throw new TypeError("Invalid controller name.")}else if(!(0<=(controller=Math.floor(controller))&&controller<=119))throw new RangeError("Controller numbers must be between 0 and 119.");if(!(0<=(value=Math.floor(value)||0)&&value<=127))throw new RangeError("Controller value must be between 0 and 127.");return wm.toMIDIChannels(channel).forEach(function(ch){this.send((wm.MIDI_CHANNEL_MESSAGES.controlchange<<4)+(ch-1),[controller,value],this._parseTimeParameter(options.time));}.bind(this)),this},Output.prototype._selectRegisteredParameter=function(parameter,channel,time){var that=this;if(parameter[0]=Math.floor(parameter[0]),!(0<=parameter[0]&&parameter[0]<=127))throw new RangeError("The control65 value must be between 0 and 127");if(parameter[1]=Math.floor(parameter[1]),!(0<=parameter[1]&&parameter[1]<=127))throw new RangeError("The control64 value must be between 0 and 127");return wm.toMIDIChannels(channel).forEach(function(){that.sendControlChange(101,parameter[0],channel,{time:time}),that.sendControlChange(100,parameter[1],channel,{time:time});}),this},Output.prototype._selectNonRegisteredParameter=function(parameter,channel,time){var that=this;if(parameter[0]=Math.floor(parameter[0]),!(0<=parameter[0]&&parameter[0]<=127))throw new RangeError("The control63 value must be between 0 and 127");if(parameter[1]=Math.floor(parameter[1]),!(0<=parameter[1]&&parameter[1]<=127))throw new RangeError("The control62 value must be between 0 and 127");return wm.toMIDIChannels(channel).forEach(function(){that.sendControlChange(99,parameter[0],channel,{time:time}),that.sendControlChange(98,parameter[1],channel,{time:time});}),this},Output.prototype._setCurrentRegisteredParameter=function(data,channel,time){var that=this;if((data=[].concat(data))[0]=Math.floor(data[0]),!(0<=data[0]&&data[0]<=127))throw new RangeError("The msb value must be between 0 and 127");return wm.toMIDIChannels(channel).forEach(function(){that.sendControlChange(6,data[0],channel,{time:time});}),data[1]=Math.floor(data[1]),0<=data[1]&&data[1]<=127&&wm.toMIDIChannels(channel).forEach(function(){that.sendControlChange(38,data[1],channel,{time:time});}),this},Output.prototype._deselectRegisteredParameter=function(channel,time){var that=this;return wm.toMIDIChannels(channel).forEach(function(){that.sendControlChange(101,127,channel,{time:time}),that.sendControlChange(100,127,channel,{time:time});}),this},Output.prototype.setRegisteredParameter=function(parameter,data,channel,options){var that=this;if(options=options||{},!Array.isArray(parameter)){if(!wm.MIDI_REGISTERED_PARAMETER[parameter])throw new Error("The specified parameter is not available.");parameter=wm.MIDI_REGISTERED_PARAMETER[parameter];}return wm.toMIDIChannels(channel).forEach(function(){that._selectRegisteredParameter(parameter,channel,options.time),that._setCurrentRegisteredParameter(data,channel,options.time),that._deselectRegisteredParameter(channel,options.time);}),this},Output.prototype.setNonRegisteredParameter=function(parameter,data,channel,options){var that=this;if(options=options||{},!(0<=parameter[0]&&parameter[0]<=127&&0<=parameter[1]&&parameter[1]<=127))throw new Error("Position 0 and 1 of the 2-position parameter array must both be between 0 and 127.");return data=[].concat(data),wm.toMIDIChannels(channel).forEach(function(){that._selectNonRegisteredParameter(parameter,channel,options.time),that._setCurrentRegisteredParameter(data,channel,options.time),that._deselectRegisteredParameter(channel,options.time);}),this},Output.prototype.incrementRegisteredParameter=function(parameter,channel,options){var that=this;if(options=options||{},!Array.isArray(parameter)){if(!wm.MIDI_REGISTERED_PARAMETER[parameter])throw new Error("The specified parameter is not available.");parameter=wm.MIDI_REGISTERED_PARAMETER[parameter];}return wm.toMIDIChannels(channel).forEach(function(){that._selectRegisteredParameter(parameter,channel,options.time),that.sendControlChange(96,0,channel,{time:options.time}),that._deselectRegisteredParameter(channel,options.time);}),this},Output.prototype.decrementRegisteredParameter=function(parameter,channel,options){if(options=options||{},!Array.isArray(parameter)){if(!wm.MIDI_REGISTERED_PARAMETER[parameter])throw new TypeError("The specified parameter is not available.");parameter=wm.MIDI_REGISTERED_PARAMETER[parameter];}return wm.toMIDIChannels(channel).forEach(function(){this._selectRegisteredParameter(parameter,channel,options.time),this.sendControlChange(97,0,channel,{time:options.time}),this._deselectRegisteredParameter(channel,options.time);}.bind(this)),this},Output.prototype.setPitchBendRange=function(semitones,cents,channel,options){var that=this;if(options=options||{},!(0<=(semitones=Math.floor(semitones)||0)&&semitones<=127))throw new RangeError("The semitones value must be between 0 and 127");if(!(0<=(cents=Math.floor(cents)||0)&&cents<=127))throw new RangeError("The cents value must be between 0 and 127");return wm.toMIDIChannels(channel).forEach(function(){that.setRegisteredParameter("pitchbendrange",[semitones,cents],channel,{time:options.time});}),this},Output.prototype.setModulationRange=function(semitones,cents,channel,options){var that=this;if(options=options||{},!(0<=(semitones=Math.floor(semitones)||0)&&semitones<=127))throw new RangeError("The semitones value must be between 0 and 127");if(!(0<=(cents=Math.floor(cents)||0)&&cents<=127))throw new RangeError("The cents value must be between 0 and 127");return wm.toMIDIChannels(channel).forEach(function(){that.setRegisteredParameter("modulationrange",[semitones,cents],channel,{time:options.time});}),this},Output.prototype.setMasterTuning=function(value,channel,options){var that=this;if(options=options||{},(value=parseFloat(value)||0)<=-65||64<=value)throw new RangeError("The value must be a decimal number larger than -65 and smaller than 64.");var coarse=Math.floor(value)+64,fine=value-Math.floor(value),msb=(fine=Math.round((fine+1)/2*16383))>>7&127,lsb=127&fine;return wm.toMIDIChannels(channel).forEach(function(){that.setRegisteredParameter("channelcoarsetuning",coarse,channel,{time:options.time}),that.setRegisteredParameter("channelfinetuning",[msb,lsb],channel,{time:options.time});}),this},Output.prototype.setTuningProgram=function(value,channel,options){var that=this;if(options=options||{},!(0<=(value=Math.floor(value))&&value<=127))throw new RangeError("The program value must be between 0 and 127");return wm.toMIDIChannels(channel).forEach(function(){that.setRegisteredParameter("tuningprogram",value,channel,{time:options.time});}),this},Output.prototype.setTuningBank=function(value,channel,options){var that=this;if(options=options||{},!(0<=(value=Math.floor(value)||0)&&value<=127))throw new RangeError("The bank value must be between 0 and 127");return wm.toMIDIChannels(channel).forEach(function(){that.setRegisteredParameter("tuningbank",value,channel,{time:options.time});}),this},Output.prototype.sendChannelMode=function(command,value,channel,options){if(options=options||{},"string"==typeof command){if(!(command=wm.MIDI_CHANNEL_MODE_MESSAGES[command]))throw new TypeError("Invalid channel mode message name.")}else if(!(120<=(command=Math.floor(command))&&command<=127))throw new RangeError("Channel mode numerical identifiers must be between 120 and 127.");if((value=Math.floor(value)||0)<0||127<value)throw new RangeError("Value must be an integer between 0 and 127.");return wm.toMIDIChannels(channel).forEach(function(ch){this.send((wm.MIDI_CHANNEL_MESSAGES.channelmode<<4)+(ch-1),[command,value],this._parseTimeParameter(options.time));}.bind(this)),this},Output.prototype.sendProgramChange=function(program,channel,options){var that=this;if(options=options||{},program=Math.floor(program),isNaN(program)||program<0||127<program)throw new RangeError("Program numbers must be between 0 and 127.");return wm.toMIDIChannels(channel).forEach(function(ch){that.send((wm.MIDI_CHANNEL_MESSAGES.programchange<<4)+(ch-1),[program],that._parseTimeParameter(options.time));}),this},Output.prototype.sendChannelAftertouch=function(pressure,channel,options){var that=this;options=options||{},pressure=parseFloat(pressure),(isNaN(pressure)||pressure<0||1<pressure)&&(pressure=.5);var nPressure=Math.round(127*pressure);return wm.toMIDIChannels(channel).forEach(function(ch){that.send((wm.MIDI_CHANNEL_MESSAGES.channelaftertouch<<4)+(ch-1),[nPressure],that._parseTimeParameter(options.time));}),this},Output.prototype.sendPitchBend=function(bend,channel,options){var that=this;if(options=options||{},isNaN(bend)||bend<-1||1<bend)throw new RangeError("Pitch bend value must be between -1 and 1.");var nLevel=Math.round((bend+1)/2*16383),msb=nLevel>>7&127,lsb=127&nLevel;return wm.toMIDIChannels(channel).forEach(function(ch){that.send((wm.MIDI_CHANNEL_MESSAGES.pitchbend<<4)+(ch-1),[lsb,msb],that._parseTimeParameter(options.time));}),this},Output.prototype._parseTimeParameter=function(time){var value,parsed=parseFloat(time);return "string"==typeof time&&"+"===time.substring(0,1)?parsed&&0<parsed&&(value=wm.time+parsed):parsed>wm.time&&(value=parsed),value},Output.prototype._convertNoteToArray=function(note){var notes=[];return Array.isArray(note)||(note=[note]),note.forEach(function(item){notes.push(wm.guessNoteNumber(item));}),notes},module.exports?module.exports=wm:scope.WebMidi||(scope.WebMidi=wm);}(commonjsGlobal);
    });

    const isWebMidi = () => {
        return navigator["requestMIDIAccess"];
    };
    // TODO: Fix this so that it returns a boolean
    const enableWebMidi = async () => {
        if (webmidi_min.enabled) {
            return;
        }
        return webmidi_min.enable();
    };
    const disableWebMidi = async () => {
        if (webmidi_min.enabled) {
            return;
        }
        return webmidi_min.disable();
    };
    const getInputs = () => {
        // Viewing available inputs and outputs
        const inputs = webmidi_min.inputs;
        return inputs;
    };
    const getOutputs = () => {
        const outputs = webmidi_min.outputs;
        return outputs;
    };
    // TODO: Fix async behaviour 
    const playNote = async (port, note) => {
        enableWebMidi().then(x => {
            console.log('playNote');
            webmidi_min.outputs[port].playNote(note, 'all', { duration: 4000, velocity: 1 });
        });
    };
    const sendCc = (port, controller, value) => {
        enableWebMidi().then(x => {
            console.log('sendCc');
            webmidi_min.outputs[port].sendControlChange(controller, value, 'all');
        });
    };

    /* src\components\JoystickControls.svelte generated by Svelte v3.35.0 */

    const file$7 = "src\\components\\JoystickControls.svelte";

    function create_fragment$7(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			add_location(div, file$7, 2, 0, 39);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("JoystickControls", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<JoystickControls> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class JoystickControls extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "JoystickControls",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\components\TrackControls.svelte generated by Svelte v3.35.0 */
    const file$6 = "src\\components\\TrackControls.svelte";

    function create_fragment$6(ctx) {
    	let div;
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let button2;
    	let t5;
    	let button3;
    	let t7;
    	let button4;
    	let t9;
    	let button5;
    	let t11;
    	let button6;
    	let t13;
    	let button7;
    	let t15;
    	let button8;
    	let t17;
    	let button9;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "Enable All";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Disable All";
    			t3 = space();
    			button2 = element("button");
    			button2.textContent = "Track 1";
    			t5 = space();
    			button3 = element("button");
    			button3.textContent = "Track 2";
    			t7 = space();
    			button4 = element("button");
    			button4.textContent = "Track 3";
    			t9 = space();
    			button5 = element("button");
    			button5.textContent = "Track 4";
    			t11 = space();
    			button6 = element("button");
    			button6.textContent = "Track 5";
    			t13 = space();
    			button7 = element("button");
    			button7.textContent = "Track 6";
    			t15 = space();
    			button8 = element("button");
    			button8.textContent = "Track 7";
    			t17 = space();
    			button9 = element("button");
    			button9.textContent = "Track 8";
    			attr_dev(button0, "id", "b01");
    			add_location(button0, file$6, 18, 4, 984);
    			attr_dev(button1, "id", "b02");
    			add_location(button1, file$6, 19, 4, 1027);
    			add_location(button2, file$6, 20, 4, 1070);
    			add_location(button3, file$6, 21, 4, 1101);
    			add_location(button4, file$6, 22, 4, 1132);
    			add_location(button5, file$6, 23, 4, 1163);
    			add_location(button6, file$6, 24, 4, 1194);
    			add_location(button7, file$6, 25, 4, 1225);
    			add_location(button8, file$6, 26, 4, 1256);
    			add_location(button9, file$6, 27, 4, 1287);
    			add_location(div, file$6, 17, 0, 972);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(div, t1);
    			append_dev(div, button1);
    			append_dev(div, t3);
    			append_dev(div, button2);
    			append_dev(div, t5);
    			append_dev(div, button3);
    			append_dev(div, t7);
    			append_dev(div, button4);
    			append_dev(div, t9);
    			append_dev(div, button5);
    			append_dev(div, t11);
    			append_dev(div, button6);
    			append_dev(div, t13);
    			append_dev(div, button7);
    			append_dev(div, t15);
    			append_dev(div, button8);
    			append_dev(div, t17);
    			append_dev(div, button9);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TrackControls", slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	// onload enable all tracks
    	onMount(() => __awaiter(void 0, void 0, void 0, function* () {
    		enableWebMidi();
    	}));

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TrackControls> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ __awaiter, enableWebMidi, onMount });

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class TrackControls extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TrackControls",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    function is_date(obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    }

    function tick_spring(ctx, last_value, current_value, target_value) {
        if (typeof current_value === 'number' || is_date(current_value)) {
            // @ts-ignore
            const delta = target_value - current_value;
            // @ts-ignore
            const velocity = (current_value - last_value) / (ctx.dt || 1 / 60); // guard div by 0
            const spring = ctx.opts.stiffness * delta;
            const damper = ctx.opts.damping * velocity;
            const acceleration = (spring - damper) * ctx.inv_mass;
            const d = (velocity + acceleration) * ctx.dt;
            if (Math.abs(d) < ctx.opts.precision && Math.abs(delta) < ctx.opts.precision) {
                return target_value; // settled
            }
            else {
                ctx.settled = false; // signal loop to keep ticking
                // @ts-ignore
                return is_date(current_value) ?
                    new Date(current_value.getTime() + d) : current_value + d;
            }
        }
        else if (Array.isArray(current_value)) {
            // @ts-ignore
            return current_value.map((_, i) => tick_spring(ctx, last_value[i], current_value[i], target_value[i]));
        }
        else if (typeof current_value === 'object') {
            const next_value = {};
            for (const k in current_value) {
                // @ts-ignore
                next_value[k] = tick_spring(ctx, last_value[k], current_value[k], target_value[k]);
            }
            // @ts-ignore
            return next_value;
        }
        else {
            throw new Error(`Cannot spring ${typeof current_value} values`);
        }
    }
    function spring(value, opts = {}) {
        const store = writable(value);
        const { stiffness = 0.15, damping = 0.8, precision = 0.01 } = opts;
        let last_time;
        let task;
        let current_token;
        let last_value = value;
        let target_value = value;
        let inv_mass = 1;
        let inv_mass_recovery_rate = 0;
        let cancel_task = false;
        function set(new_value, opts = {}) {
            target_value = new_value;
            const token = current_token = {};
            if (value == null || opts.hard || (spring.stiffness >= 1 && spring.damping >= 1)) {
                cancel_task = true; // cancel any running animation
                last_time = now();
                last_value = new_value;
                store.set(value = target_value);
                return Promise.resolve();
            }
            else if (opts.soft) {
                const rate = opts.soft === true ? .5 : +opts.soft;
                inv_mass_recovery_rate = 1 / (rate * 60);
                inv_mass = 0; // infinite mass, unaffected by spring forces
            }
            if (!task) {
                last_time = now();
                cancel_task = false;
                task = loop(now => {
                    if (cancel_task) {
                        cancel_task = false;
                        task = null;
                        return false;
                    }
                    inv_mass = Math.min(inv_mass + inv_mass_recovery_rate, 1);
                    const ctx = {
                        inv_mass,
                        opts: spring,
                        settled: true,
                        dt: (now - last_time) * 60 / 1000
                    };
                    const next_value = tick_spring(ctx, last_value, value, target_value);
                    last_time = now;
                    last_value = value;
                    store.set(value = next_value);
                    if (ctx.settled) {
                        task = null;
                    }
                    return !ctx.settled;
                });
            }
            return new Promise(fulfil => {
                task.promise.then(() => {
                    if (token === current_token)
                        fulfil();
                });
            });
        }
        const spring = {
            set,
            update: (fn, opts) => set(fn(target_value, value), opts),
            subscribe: store.subscribe,
            stiffness,
            damping,
            precision
        };
        return spring;
    }

    /* node_modules\svelte-range-slider-pips\src\RangePips.svelte generated by Svelte v3.35.0 */

    const file$5 = "node_modules\\svelte-range-slider-pips\\src\\RangePips.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	child_ctx[23] = i;
    	return child_ctx;
    }

    // (137:2) {#if ( all && first !== false ) || first }
    function create_if_block_5(ctx) {
    	let span;
    	let span_style_value;
    	let if_block = (/*all*/ ctx[3] === "label" || /*first*/ ctx[4] === "label") && create_if_block_6(ctx);

    	const block = {
    		c: function create() {
    			span = element("span");
    			if (if_block) if_block.c();
    			attr_dev(span, "class", "pip first");
    			attr_dev(span, "style", span_style_value = "" + ((/*vertical*/ ctx[2] ? "top" : "left") + ": 0%;"));
    			toggle_class(span, "selected", /*isSelected*/ ctx[14](/*min*/ ctx[0]));
    			toggle_class(span, "in-range", /*inRange*/ ctx[15](/*min*/ ctx[0]));
    			add_location(span, file$5, 137, 4, 3365);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			if (if_block) if_block.m(span, null);
    		},
    		p: function update(ctx, dirty) {
    			if (/*all*/ ctx[3] === "label" || /*first*/ ctx[4] === "label") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_6(ctx);
    					if_block.c();
    					if_block.m(span, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*vertical*/ 4 && span_style_value !== (span_style_value = "" + ((/*vertical*/ ctx[2] ? "top" : "left") + ": 0%;"))) {
    				attr_dev(span, "style", span_style_value);
    			}

    			if (dirty & /*isSelected, min*/ 16385) {
    				toggle_class(span, "selected", /*isSelected*/ ctx[14](/*min*/ ctx[0]));
    			}

    			if (dirty & /*inRange, min*/ 32769) {
    				toggle_class(span, "in-range", /*inRange*/ ctx[15](/*min*/ ctx[0]));
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(137:2) {#if ( all && first !== false ) || first }",
    		ctx
    	});

    	return block;
    }

    // (143:6) {#if all === 'label' || first === 'label'}
    function create_if_block_6(ctx) {
    	let span;
    	let t0;
    	let t1_value = /*formatter*/ ctx[9](/*min*/ ctx[0]) + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(/*prefix*/ ctx[7]);
    			t1 = text(t1_value);
    			t2 = text(/*suffix*/ ctx[8]);
    			attr_dev(span, "class", "pipVal");
    			add_location(span, file$5, 143, 8, 3575);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*prefix*/ 128) set_data_dev(t0, /*prefix*/ ctx[7]);
    			if (dirty & /*formatter, min*/ 513 && t1_value !== (t1_value = /*formatter*/ ctx[9](/*min*/ ctx[0]) + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*suffix*/ 256) set_data_dev(t2, /*suffix*/ ctx[8]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(143:6) {#if all === 'label' || first === 'label'}",
    		ctx
    	});

    	return block;
    }

    // (150:2) {#if ( all && rest !== false ) || rest}
    function create_if_block_2$1(ctx) {
    	let each_1_anchor;
    	let each_value = Array(/*pipCount*/ ctx[12] + 1);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*vertical, percentOf, pipVal, isSelected, inRange, suffix, formatter, prefix, all, rest, min, max, pipCount*/ 64463) {
    				each_value = Array(/*pipCount*/ ctx[12] + 1);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(150:2) {#if ( all && rest !== false ) || rest}",
    		ctx
    	});

    	return block;
    }

    // (152:6) {#if pipVal(i) !== min && pipVal(i) !== max}
    function create_if_block_3(ctx) {
    	let span;
    	let t;
    	let span_style_value;
    	let if_block = (/*all*/ ctx[3] === "label" || /*rest*/ ctx[6] === "label") && create_if_block_4(ctx);

    	const block = {
    		c: function create() {
    			span = element("span");
    			if (if_block) if_block.c();
    			t = space();
    			attr_dev(span, "class", "pip");
    			attr_dev(span, "style", span_style_value = "" + ((/*vertical*/ ctx[2] ? "top" : "left") + ": " + /*percentOf*/ ctx[11](/*pipVal*/ ctx[13](/*i*/ ctx[23])) + "%;"));
    			toggle_class(span, "selected", /*isSelected*/ ctx[14](/*pipVal*/ ctx[13](/*i*/ ctx[23])));
    			toggle_class(span, "in-range", /*inRange*/ ctx[15](/*pipVal*/ ctx[13](/*i*/ ctx[23])));
    			add_location(span, file$5, 152, 8, 3829);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			if (if_block) if_block.m(span, null);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (/*all*/ ctx[3] === "label" || /*rest*/ ctx[6] === "label") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_4(ctx);
    					if_block.c();
    					if_block.m(span, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*vertical, percentOf, pipVal*/ 10244 && span_style_value !== (span_style_value = "" + ((/*vertical*/ ctx[2] ? "top" : "left") + ": " + /*percentOf*/ ctx[11](/*pipVal*/ ctx[13](/*i*/ ctx[23])) + "%;"))) {
    				attr_dev(span, "style", span_style_value);
    			}

    			if (dirty & /*isSelected, pipVal*/ 24576) {
    				toggle_class(span, "selected", /*isSelected*/ ctx[14](/*pipVal*/ ctx[13](/*i*/ ctx[23])));
    			}

    			if (dirty & /*inRange, pipVal*/ 40960) {
    				toggle_class(span, "in-range", /*inRange*/ ctx[15](/*pipVal*/ ctx[13](/*i*/ ctx[23])));
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(152:6) {#if pipVal(i) !== min && pipVal(i) !== max}",
    		ctx
    	});

    	return block;
    }

    // (158:10) {#if all === 'label' || rest === 'label'}
    function create_if_block_4(ctx) {
    	let span;
    	let t0;
    	let t1_value = /*formatter*/ ctx[9](/*pipVal*/ ctx[13](/*i*/ ctx[23])) + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(/*prefix*/ ctx[7]);
    			t1 = text(t1_value);
    			t2 = text(/*suffix*/ ctx[8]);
    			attr_dev(span, "class", "pipVal");
    			add_location(span, file$5, 158, 12, 4089);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*prefix*/ 128) set_data_dev(t0, /*prefix*/ ctx[7]);
    			if (dirty & /*formatter, pipVal*/ 8704 && t1_value !== (t1_value = /*formatter*/ ctx[9](/*pipVal*/ ctx[13](/*i*/ ctx[23])) + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*suffix*/ 256) set_data_dev(t2, /*suffix*/ ctx[8]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(158:10) {#if all === 'label' || rest === 'label'}",
    		ctx
    	});

    	return block;
    }

    // (151:4) {#each Array(pipCount + 1) as _, i}
    function create_each_block$2(ctx) {
    	let show_if = /*pipVal*/ ctx[13](/*i*/ ctx[23]) !== /*min*/ ctx[0] && /*pipVal*/ ctx[13](/*i*/ ctx[23]) !== /*max*/ ctx[1];
    	let if_block_anchor;
    	let if_block = show_if && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*pipVal, min, max*/ 8195) show_if = /*pipVal*/ ctx[13](/*i*/ ctx[23]) !== /*min*/ ctx[0] && /*pipVal*/ ctx[13](/*i*/ ctx[23]) !== /*max*/ ctx[1];

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_3(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(151:4) {#each Array(pipCount + 1) as _, i}",
    		ctx
    	});

    	return block;
    }

    // (167:2) {#if ( all && last !== false ) || last}
    function create_if_block$1(ctx) {
    	let span;
    	let span_style_value;
    	let if_block = (/*all*/ ctx[3] === "label" || /*last*/ ctx[5] === "label") && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			span = element("span");
    			if (if_block) if_block.c();
    			attr_dev(span, "class", "pip last");
    			attr_dev(span, "style", span_style_value = "" + ((/*vertical*/ ctx[2] ? "top" : "left") + ": 100%;"));
    			toggle_class(span, "selected", /*isSelected*/ ctx[14](/*max*/ ctx[1]));
    			toggle_class(span, "in-range", /*inRange*/ ctx[15](/*max*/ ctx[1]));
    			add_location(span, file$5, 167, 4, 4294);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			if (if_block) if_block.m(span, null);
    		},
    		p: function update(ctx, dirty) {
    			if (/*all*/ ctx[3] === "label" || /*last*/ ctx[5] === "label") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					if_block.m(span, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*vertical*/ 4 && span_style_value !== (span_style_value = "" + ((/*vertical*/ ctx[2] ? "top" : "left") + ": 100%;"))) {
    				attr_dev(span, "style", span_style_value);
    			}

    			if (dirty & /*isSelected, max*/ 16386) {
    				toggle_class(span, "selected", /*isSelected*/ ctx[14](/*max*/ ctx[1]));
    			}

    			if (dirty & /*inRange, max*/ 32770) {
    				toggle_class(span, "in-range", /*inRange*/ ctx[15](/*max*/ ctx[1]));
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(167:2) {#if ( all && last !== false ) || last}",
    		ctx
    	});

    	return block;
    }

    // (173:6) {#if all === 'label' || last === 'label'}
    function create_if_block_1$1(ctx) {
    	let span;
    	let t0;
    	let t1_value = /*formatter*/ ctx[9](/*max*/ ctx[1]) + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(/*prefix*/ ctx[7]);
    			t1 = text(t1_value);
    			t2 = text(/*suffix*/ ctx[8]);
    			attr_dev(span, "class", "pipVal");
    			add_location(span, file$5, 173, 8, 4504);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*prefix*/ 128) set_data_dev(t0, /*prefix*/ ctx[7]);
    			if (dirty & /*formatter, max*/ 514 && t1_value !== (t1_value = /*formatter*/ ctx[9](/*max*/ ctx[1]) + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*suffix*/ 256) set_data_dev(t2, /*suffix*/ ctx[8]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(173:6) {#if all === 'label' || last === 'label'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let if_block0 = (/*all*/ ctx[3] && /*first*/ ctx[4] !== false || /*first*/ ctx[4]) && create_if_block_5(ctx);
    	let if_block1 = (/*all*/ ctx[3] && /*rest*/ ctx[6] !== false || /*rest*/ ctx[6]) && create_if_block_2$1(ctx);
    	let if_block2 = (/*all*/ ctx[3] && /*last*/ ctx[5] !== false || /*last*/ ctx[5]) && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(div, "class", "rangePips");
    			toggle_class(div, "focus", /*focus*/ ctx[10]);
    			toggle_class(div, "vertical", /*vertical*/ ctx[2]);
    			add_location(div, file$5, 135, 0, 3265);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t1);
    			if (if_block2) if_block2.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*all*/ ctx[3] && /*first*/ ctx[4] !== false || /*first*/ ctx[4]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_5(ctx);
    					if_block0.c();
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*all*/ ctx[3] && /*rest*/ ctx[6] !== false || /*rest*/ ctx[6]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2$1(ctx);
    					if_block1.c();
    					if_block1.m(div, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*all*/ ctx[3] && /*last*/ ctx[5] !== false || /*last*/ ctx[5]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block$1(ctx);
    					if_block2.c();
    					if_block2.m(div, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (dirty & /*focus*/ 1024) {
    				toggle_class(div, "focus", /*focus*/ ctx[10]);
    			}

    			if (dirty & /*vertical*/ 4) {
    				toggle_class(div, "vertical", /*vertical*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let pipStep;
    	let pipCount;
    	let pipVal;
    	let isSelected;
    	let inRange;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("RangePips", slots, []);
    	let { range = false } = $$props;
    	let { min = 0 } = $$props;
    	let { max = 100 } = $$props;
    	let { step = 1 } = $$props;
    	let { values = [(max + min) / 2] } = $$props;
    	let { vertical = false } = $$props;
    	let { pipstep = undefined } = $$props;
    	let { all = true } = $$props;
    	let { first = undefined } = $$props;
    	let { last = undefined } = $$props;
    	let { rest = undefined } = $$props;
    	let { prefix = "" } = $$props;
    	let { suffix = "" } = $$props;
    	let { formatter = v => v } = $$props;
    	let { focus = undefined } = $$props;
    	let { percentOf = undefined } = $$props;

    	const writable_props = [
    		"range",
    		"min",
    		"max",
    		"step",
    		"values",
    		"vertical",
    		"pipstep",
    		"all",
    		"first",
    		"last",
    		"rest",
    		"prefix",
    		"suffix",
    		"formatter",
    		"focus",
    		"percentOf"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<RangePips> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("range" in $$props) $$invalidate(16, range = $$props.range);
    		if ("min" in $$props) $$invalidate(0, min = $$props.min);
    		if ("max" in $$props) $$invalidate(1, max = $$props.max);
    		if ("step" in $$props) $$invalidate(17, step = $$props.step);
    		if ("values" in $$props) $$invalidate(18, values = $$props.values);
    		if ("vertical" in $$props) $$invalidate(2, vertical = $$props.vertical);
    		if ("pipstep" in $$props) $$invalidate(19, pipstep = $$props.pipstep);
    		if ("all" in $$props) $$invalidate(3, all = $$props.all);
    		if ("first" in $$props) $$invalidate(4, first = $$props.first);
    		if ("last" in $$props) $$invalidate(5, last = $$props.last);
    		if ("rest" in $$props) $$invalidate(6, rest = $$props.rest);
    		if ("prefix" in $$props) $$invalidate(7, prefix = $$props.prefix);
    		if ("suffix" in $$props) $$invalidate(8, suffix = $$props.suffix);
    		if ("formatter" in $$props) $$invalidate(9, formatter = $$props.formatter);
    		if ("focus" in $$props) $$invalidate(10, focus = $$props.focus);
    		if ("percentOf" in $$props) $$invalidate(11, percentOf = $$props.percentOf);
    	};

    	$$self.$capture_state = () => ({
    		range,
    		min,
    		max,
    		step,
    		values,
    		vertical,
    		pipstep,
    		all,
    		first,
    		last,
    		rest,
    		prefix,
    		suffix,
    		formatter,
    		focus,
    		percentOf,
    		pipStep,
    		pipCount,
    		pipVal,
    		isSelected,
    		inRange
    	});

    	$$self.$inject_state = $$props => {
    		if ("range" in $$props) $$invalidate(16, range = $$props.range);
    		if ("min" in $$props) $$invalidate(0, min = $$props.min);
    		if ("max" in $$props) $$invalidate(1, max = $$props.max);
    		if ("step" in $$props) $$invalidate(17, step = $$props.step);
    		if ("values" in $$props) $$invalidate(18, values = $$props.values);
    		if ("vertical" in $$props) $$invalidate(2, vertical = $$props.vertical);
    		if ("pipstep" in $$props) $$invalidate(19, pipstep = $$props.pipstep);
    		if ("all" in $$props) $$invalidate(3, all = $$props.all);
    		if ("first" in $$props) $$invalidate(4, first = $$props.first);
    		if ("last" in $$props) $$invalidate(5, last = $$props.last);
    		if ("rest" in $$props) $$invalidate(6, rest = $$props.rest);
    		if ("prefix" in $$props) $$invalidate(7, prefix = $$props.prefix);
    		if ("suffix" in $$props) $$invalidate(8, suffix = $$props.suffix);
    		if ("formatter" in $$props) $$invalidate(9, formatter = $$props.formatter);
    		if ("focus" in $$props) $$invalidate(10, focus = $$props.focus);
    		if ("percentOf" in $$props) $$invalidate(11, percentOf = $$props.percentOf);
    		if ("pipStep" in $$props) $$invalidate(20, pipStep = $$props.pipStep);
    		if ("pipCount" in $$props) $$invalidate(12, pipCount = $$props.pipCount);
    		if ("pipVal" in $$props) $$invalidate(13, pipVal = $$props.pipVal);
    		if ("isSelected" in $$props) $$invalidate(14, isSelected = $$props.isSelected);
    		if ("inRange" in $$props) $$invalidate(15, inRange = $$props.inRange);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*pipstep, max, min, step, vertical*/ 655367) {
    			$$invalidate(20, pipStep = pipstep || ((max - min) / step >= (vertical ? 50 : 100)
    			? (max - min) / (vertical ? 10 : 20)
    			: 1));
    		}

    		if ($$self.$$.dirty & /*max, min, step, pipStep*/ 1179651) {
    			$$invalidate(12, pipCount = parseInt((max - min) / (step * pipStep), 10));
    		}

    		if ($$self.$$.dirty & /*min, step, pipStep*/ 1179649) {
    			$$invalidate(13, pipVal = function (val) {
    				return min + val * step * pipStep;
    			});
    		}

    		if ($$self.$$.dirty & /*values*/ 262144) {
    			$$invalidate(14, isSelected = function (val) {
    				return values.some(v => v === val);
    			});
    		}

    		if ($$self.$$.dirty & /*range, values*/ 327680) {
    			$$invalidate(15, inRange = function (val) {
    				if (range === "min") {
    					return values[0] > val;
    				} else if (range === "max") {
    					return values[0] < val;
    				} else if (range) {
    					return values[0] < val && values[1] > val;
    				}
    			});
    		}
    	};

    	return [
    		min,
    		max,
    		vertical,
    		all,
    		first,
    		last,
    		rest,
    		prefix,
    		suffix,
    		formatter,
    		focus,
    		percentOf,
    		pipCount,
    		pipVal,
    		isSelected,
    		inRange,
    		range,
    		step,
    		values,
    		pipstep,
    		pipStep
    	];
    }

    class RangePips extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			range: 16,
    			min: 0,
    			max: 1,
    			step: 17,
    			values: 18,
    			vertical: 2,
    			pipstep: 19,
    			all: 3,
    			first: 4,
    			last: 5,
    			rest: 6,
    			prefix: 7,
    			suffix: 8,
    			formatter: 9,
    			focus: 10,
    			percentOf: 11
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RangePips",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get range() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set range(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get min() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set min(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get max() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set max(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get step() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set step(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get values() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set values(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get vertical() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set vertical(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pipstep() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pipstep(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get all() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set all(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get first() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set first(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get last() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set last(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rest() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rest(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get suffix() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set suffix(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get formatter() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set formatter(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get focus() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set focus(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get percentOf() {
    		throw new Error("<RangePips>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set percentOf(value) {
    		throw new Error("<RangePips>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-range-slider-pips\src\RangeSlider.svelte generated by Svelte v3.35.0 */

    const { console: console_1$1 } = globals;
    const file$4 = "node_modules\\svelte-range-slider-pips\\src\\RangeSlider.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[59] = list[i];
    	child_ctx[61] = i;
    	return child_ctx;
    }

    // (766:6) {#if float}
    function create_if_block_2(ctx) {
    	let span;
    	let t0;
    	let t1_value = /*handleFormatter*/ ctx[19](/*value*/ ctx[59]) + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(/*prefix*/ ctx[16]);
    			t1 = text(t1_value);
    			t2 = text(/*suffix*/ ctx[17]);
    			attr_dev(span, "class", "rangeFloat");
    			add_location(span, file$4, 766, 8, 22002);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*prefix*/ 65536) set_data_dev(t0, /*prefix*/ ctx[16]);
    			if (dirty[0] & /*handleFormatter, values*/ 524289 && t1_value !== (t1_value = /*handleFormatter*/ ctx[19](/*value*/ ctx[59]) + "")) set_data_dev(t1, t1_value);
    			if (dirty[0] & /*suffix*/ 131072) set_data_dev(t2, /*suffix*/ ctx[17]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(766:6) {#if float}",
    		ctx
    	});

    	return block;
    }

    // (745:2) {#each values as value, index}
    function create_each_block$1(ctx) {
    	let span1;
    	let span0;
    	let t;
    	let span1_style_value;
    	let span1_aria_valuemin_value;
    	let span1_aria_valuemax_value;
    	let span1_aria_valuenow_value;
    	let span1_aria_valuetext_value;
    	let span1_aria_orientation_value;
    	let span1_tabindex_value;
    	let mounted;
    	let dispose;
    	let if_block = /*float*/ ctx[6] && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			span1 = element("span");
    			span0 = element("span");
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(span0, "class", "rangeNub");
    			add_location(span0, file$4, 764, 6, 21950);
    			attr_dev(span1, "role", "slider");
    			attr_dev(span1, "class", "rangeHandle");
    			attr_dev(span1, "style", span1_style_value = "" + ((/*vertical*/ ctx[5] ? "top" : "left") + ": " + /*$springPositions*/ ctx[26][/*index*/ ctx[61]] + "%; z-index: " + (/*activeHandle*/ ctx[25] === /*index*/ ctx[61] ? 3 : 2) + ";"));

    			attr_dev(span1, "aria-valuemin", span1_aria_valuemin_value = /*range*/ ctx[1] === true && /*index*/ ctx[61] === 1
    			? /*values*/ ctx[0][0]
    			: /*min*/ ctx[2]);

    			attr_dev(span1, "aria-valuemax", span1_aria_valuemax_value = /*range*/ ctx[1] === true && /*index*/ ctx[61] === 0
    			? /*values*/ ctx[0][1]
    			: /*max*/ ctx[3]);

    			attr_dev(span1, "aria-valuenow", span1_aria_valuenow_value = /*value*/ ctx[59]);
    			attr_dev(span1, "aria-valuetext", span1_aria_valuetext_value = "" + (/*prefix*/ ctx[16] + /*handleFormatter*/ ctx[19](/*value*/ ctx[59]) + /*suffix*/ ctx[17]));
    			attr_dev(span1, "aria-orientation", span1_aria_orientation_value = /*vertical*/ ctx[5] ? "vertical" : "horizontal");
    			attr_dev(span1, "aria-disabled", /*disabled*/ ctx[8]);
    			attr_dev(span1, "disabled", /*disabled*/ ctx[8]);
    			attr_dev(span1, "tabindex", span1_tabindex_value = /*disabled*/ ctx[8] ? -1 : 0);
    			toggle_class(span1, "hoverable", /*hover*/ ctx[7] && !/*disabled*/ ctx[8]);
    			toggle_class(span1, "active", /*focus*/ ctx[23] && /*activeHandle*/ ctx[25] === /*index*/ ctx[61]);
    			toggle_class(span1, "press", /*handlePressed*/ ctx[24] && /*activeHandle*/ ctx[25] === /*index*/ ctx[61]);
    			add_location(span1, file$4, 745, 4, 21134);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span1, anchor);
    			append_dev(span1, span0);
    			append_dev(span1, t);
    			if (if_block) if_block.m(span1, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(span1, "blur", /*sliderBlurHandle*/ ctx[29], false, false, false),
    					listen_dev(span1, "focus", /*sliderFocusHandle*/ ctx[30], false, false, false),
    					listen_dev(span1, "keydown", /*sliderKeydown*/ ctx[31], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*float*/ ctx[6]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					if_block.m(span1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*vertical, $springPositions, activeHandle*/ 100663328 && span1_style_value !== (span1_style_value = "" + ((/*vertical*/ ctx[5] ? "top" : "left") + ": " + /*$springPositions*/ ctx[26][/*index*/ ctx[61]] + "%; z-index: " + (/*activeHandle*/ ctx[25] === /*index*/ ctx[61] ? 3 : 2) + ";"))) {
    				attr_dev(span1, "style", span1_style_value);
    			}

    			if (dirty[0] & /*range, values, min*/ 7 && span1_aria_valuemin_value !== (span1_aria_valuemin_value = /*range*/ ctx[1] === true && /*index*/ ctx[61] === 1
    			? /*values*/ ctx[0][0]
    			: /*min*/ ctx[2])) {
    				attr_dev(span1, "aria-valuemin", span1_aria_valuemin_value);
    			}

    			if (dirty[0] & /*range, values, max*/ 11 && span1_aria_valuemax_value !== (span1_aria_valuemax_value = /*range*/ ctx[1] === true && /*index*/ ctx[61] === 0
    			? /*values*/ ctx[0][1]
    			: /*max*/ ctx[3])) {
    				attr_dev(span1, "aria-valuemax", span1_aria_valuemax_value);
    			}

    			if (dirty[0] & /*values*/ 1 && span1_aria_valuenow_value !== (span1_aria_valuenow_value = /*value*/ ctx[59])) {
    				attr_dev(span1, "aria-valuenow", span1_aria_valuenow_value);
    			}

    			if (dirty[0] & /*prefix, handleFormatter, values, suffix*/ 720897 && span1_aria_valuetext_value !== (span1_aria_valuetext_value = "" + (/*prefix*/ ctx[16] + /*handleFormatter*/ ctx[19](/*value*/ ctx[59]) + /*suffix*/ ctx[17]))) {
    				attr_dev(span1, "aria-valuetext", span1_aria_valuetext_value);
    			}

    			if (dirty[0] & /*vertical*/ 32 && span1_aria_orientation_value !== (span1_aria_orientation_value = /*vertical*/ ctx[5] ? "vertical" : "horizontal")) {
    				attr_dev(span1, "aria-orientation", span1_aria_orientation_value);
    			}

    			if (dirty[0] & /*disabled*/ 256) {
    				attr_dev(span1, "aria-disabled", /*disabled*/ ctx[8]);
    			}

    			if (dirty[0] & /*disabled*/ 256) {
    				attr_dev(span1, "disabled", /*disabled*/ ctx[8]);
    			}

    			if (dirty[0] & /*disabled*/ 256 && span1_tabindex_value !== (span1_tabindex_value = /*disabled*/ ctx[8] ? -1 : 0)) {
    				attr_dev(span1, "tabindex", span1_tabindex_value);
    			}

    			if (dirty[0] & /*hover, disabled*/ 384) {
    				toggle_class(span1, "hoverable", /*hover*/ ctx[7] && !/*disabled*/ ctx[8]);
    			}

    			if (dirty[0] & /*focus, activeHandle*/ 41943040) {
    				toggle_class(span1, "active", /*focus*/ ctx[23] && /*activeHandle*/ ctx[25] === /*index*/ ctx[61]);
    			}

    			if (dirty[0] & /*handlePressed, activeHandle*/ 50331648) {
    				toggle_class(span1, "press", /*handlePressed*/ ctx[24] && /*activeHandle*/ ctx[25] === /*index*/ ctx[61]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span1);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(745:2) {#each values as value, index}",
    		ctx
    	});

    	return block;
    }

    // (771:2) {#if range}
    function create_if_block_1(ctx) {
    	let span;
    	let span_style_value;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "rangeBar");
    			attr_dev(span, "style", span_style_value = "" + ((/*vertical*/ ctx[5] ? "top" : "left") + ": " + /*rangeStart*/ ctx[27](/*$springPositions*/ ctx[26]) + "%; " + (/*vertical*/ ctx[5] ? "bottom" : "right") + ":\n      " + /*rangeEnd*/ ctx[28](/*$springPositions*/ ctx[26]) + "%;"));
    			add_location(span, file$4, 771, 4, 22127);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*vertical, $springPositions*/ 67108896 && span_style_value !== (span_style_value = "" + ((/*vertical*/ ctx[5] ? "top" : "left") + ": " + /*rangeStart*/ ctx[27](/*$springPositions*/ ctx[26]) + "%; " + (/*vertical*/ ctx[5] ? "bottom" : "right") + ":\n      " + /*rangeEnd*/ ctx[28](/*$springPositions*/ ctx[26]) + "%;"))) {
    				attr_dev(span, "style", span_style_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(771:2) {#if range}",
    		ctx
    	});

    	return block;
    }

    // (777:2) {#if pips}
    function create_if_block(ctx) {
    	let rangepips;
    	let current;

    	rangepips = new RangePips({
    			props: {
    				values: /*values*/ ctx[0],
    				min: /*min*/ ctx[2],
    				max: /*max*/ ctx[3],
    				step: /*step*/ ctx[4],
    				range: /*range*/ ctx[1],
    				vertical: /*vertical*/ ctx[5],
    				all: /*all*/ ctx[11],
    				first: /*first*/ ctx[12],
    				last: /*last*/ ctx[13],
    				rest: /*rest*/ ctx[14],
    				pipstep: /*pipstep*/ ctx[10],
    				prefix: /*prefix*/ ctx[16],
    				suffix: /*suffix*/ ctx[17],
    				formatter: /*formatter*/ ctx[18],
    				focus: /*focus*/ ctx[23],
    				disabled: /*disabled*/ ctx[8],
    				percentOf: /*percentOf*/ ctx[21]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(rangepips.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(rangepips, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const rangepips_changes = {};
    			if (dirty[0] & /*values*/ 1) rangepips_changes.values = /*values*/ ctx[0];
    			if (dirty[0] & /*min*/ 4) rangepips_changes.min = /*min*/ ctx[2];
    			if (dirty[0] & /*max*/ 8) rangepips_changes.max = /*max*/ ctx[3];
    			if (dirty[0] & /*step*/ 16) rangepips_changes.step = /*step*/ ctx[4];
    			if (dirty[0] & /*range*/ 2) rangepips_changes.range = /*range*/ ctx[1];
    			if (dirty[0] & /*vertical*/ 32) rangepips_changes.vertical = /*vertical*/ ctx[5];
    			if (dirty[0] & /*all*/ 2048) rangepips_changes.all = /*all*/ ctx[11];
    			if (dirty[0] & /*first*/ 4096) rangepips_changes.first = /*first*/ ctx[12];
    			if (dirty[0] & /*last*/ 8192) rangepips_changes.last = /*last*/ ctx[13];
    			if (dirty[0] & /*rest*/ 16384) rangepips_changes.rest = /*rest*/ ctx[14];
    			if (dirty[0] & /*pipstep*/ 1024) rangepips_changes.pipstep = /*pipstep*/ ctx[10];
    			if (dirty[0] & /*prefix*/ 65536) rangepips_changes.prefix = /*prefix*/ ctx[16];
    			if (dirty[0] & /*suffix*/ 131072) rangepips_changes.suffix = /*suffix*/ ctx[17];
    			if (dirty[0] & /*formatter*/ 262144) rangepips_changes.formatter = /*formatter*/ ctx[18];
    			if (dirty[0] & /*focus*/ 8388608) rangepips_changes.focus = /*focus*/ ctx[23];
    			if (dirty[0] & /*disabled*/ 256) rangepips_changes.disabled = /*disabled*/ ctx[8];
    			if (dirty[0] & /*percentOf*/ 2097152) rangepips_changes.percentOf = /*percentOf*/ ctx[21];
    			rangepips.$set(rangepips_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(rangepips.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(rangepips.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(rangepips, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(777:2) {#if pips}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*values*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	let if_block0 = /*range*/ ctx[1] && create_if_block_1(ctx);
    	let if_block1 = /*pips*/ ctx[9] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div, "id", /*id*/ ctx[15]);
    			attr_dev(div, "class", "rangeSlider");
    			toggle_class(div, "range", /*range*/ ctx[1]);
    			toggle_class(div, "disabled", /*disabled*/ ctx[8]);
    			toggle_class(div, "vertical", /*vertical*/ ctx[5]);
    			toggle_class(div, "focus", /*focus*/ ctx[23]);
    			toggle_class(div, "min", /*range*/ ctx[1] === "min");
    			toggle_class(div, "max", /*range*/ ctx[1] === "max");
    			toggle_class(div, "pips", /*pips*/ ctx[9]);
    			toggle_class(div, "pip-labels", /*all*/ ctx[11] === "label" || /*first*/ ctx[12] === "label" || /*last*/ ctx[13] === "label" || /*rest*/ ctx[14] === "label");
    			add_location(div, file$4, 727, 0, 20635);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t0);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t1);
    			if (if_block1) if_block1.m(div, null);
    			/*div_binding*/ ctx[44](div);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "mousedown", /*bodyInteractStart*/ ctx[34], false, false, false),
    					listen_dev(window, "touchstart", /*bodyInteractStart*/ ctx[34], false, false, false),
    					listen_dev(window, "mousemove", /*bodyInteract*/ ctx[35], false, false, false),
    					listen_dev(window, "touchmove", /*bodyInteract*/ ctx[35], false, false, false),
    					listen_dev(window, "mouseup", /*bodyMouseUp*/ ctx[36], false, false, false),
    					listen_dev(window, "touchend", /*bodyTouchEnd*/ ctx[37], false, false, false),
    					listen_dev(window, "keydown", /*bodyKeyDown*/ ctx[38], false, false, false),
    					listen_dev(div, "mousedown", /*sliderInteractStart*/ ctx[32], false, false, false),
    					listen_dev(div, "mouseup", /*sliderInteractEnd*/ ctx[33], false, false, false),
    					listen_dev(div, "touchstart", prevent_default(/*sliderInteractStart*/ ctx[32]), false, true, false),
    					listen_dev(div, "touchend", prevent_default(/*sliderInteractEnd*/ ctx[33]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*vertical, $springPositions, activeHandle, range, values, min, max, prefix, handleFormatter, suffix, disabled, hover, focus, handlePressed, sliderBlurHandle, sliderFocusHandle, float*/ 1737163247 | dirty[1] & /*sliderKeydown*/ 1) {
    				each_value = /*values*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t0);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*range*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(div, t1);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*pips*/ ctx[9]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*pips*/ 512) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*id*/ 32768) {
    				attr_dev(div, "id", /*id*/ ctx[15]);
    			}

    			if (dirty[0] & /*range*/ 2) {
    				toggle_class(div, "range", /*range*/ ctx[1]);
    			}

    			if (dirty[0] & /*disabled*/ 256) {
    				toggle_class(div, "disabled", /*disabled*/ ctx[8]);
    			}

    			if (dirty[0] & /*vertical*/ 32) {
    				toggle_class(div, "vertical", /*vertical*/ ctx[5]);
    			}

    			if (dirty[0] & /*focus*/ 8388608) {
    				toggle_class(div, "focus", /*focus*/ ctx[23]);
    			}

    			if (dirty[0] & /*range*/ 2) {
    				toggle_class(div, "min", /*range*/ ctx[1] === "min");
    			}

    			if (dirty[0] & /*range*/ 2) {
    				toggle_class(div, "max", /*range*/ ctx[1] === "max");
    			}

    			if (dirty[0] & /*pips*/ 512) {
    				toggle_class(div, "pips", /*pips*/ ctx[9]);
    			}

    			if (dirty[0] & /*all, first, last, rest*/ 30720) {
    				toggle_class(div, "pip-labels", /*all*/ ctx[11] === "label" || /*first*/ ctx[12] === "label" || /*last*/ ctx[13] === "label" || /*rest*/ ctx[14] === "label");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			/*div_binding*/ ctx[44](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function index(el) {
    	if (!el) return -1;
    	var i = 0;

    	while (el = el.previousElementSibling) {
    		i++;
    	}

    	return i;
    }

    /**
     * noramlise a mouse or touch event to return the
     * client (x/y) object for that event
     * @param {event} e a mouse/touch event to normalise
     * @returns {object} normalised event client object (x,y)
     **/
    function normalisedClient(e) {
    	if (e.type.includes("touch")) {
    		return e.touches[0];
    	} else {
    		return e;
    	}
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let percentOf;
    	let clampValue;
    	let alignValueToStep;

    	let $springPositions,
    		$$unsubscribe_springPositions = noop,
    		$$subscribe_springPositions = () => ($$unsubscribe_springPositions(), $$unsubscribe_springPositions = subscribe(springPositions, $$value => $$invalidate(26, $springPositions = $$value)), springPositions);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_springPositions());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("RangeSlider", slots, []);
    	let { range = false } = $$props;
    	let { pushy = false } = $$props;
    	let { min = 0 } = $$props;
    	let { max = 100 } = $$props;
    	let { step = 1 } = $$props;
    	let { values = [(max + min) / 2] } = $$props;
    	let { vertical = false } = $$props;
    	let { float = false } = $$props;
    	let { hover = true } = $$props;
    	let { disabled = false } = $$props;
    	let { pips = false } = $$props;
    	let { pipstep = undefined } = $$props;
    	let { all = undefined } = $$props;
    	let { first = undefined } = $$props;
    	let { last = undefined } = $$props;
    	let { rest = undefined } = $$props;
    	let { id = undefined } = $$props;
    	let { prefix = "" } = $$props;
    	let { suffix = "" } = $$props;
    	let { formatter = v => v } = $$props;
    	let { handleFormatter = formatter } = $$props;
    	let { precision = 2 } = $$props;
    	let { springValues = { stiffness: 0.15, damping: 0.4 } } = $$props;

    	// prepare dispatched events
    	const dispatch = createEventDispatcher();

    	// dom references
    	let slider;

    	// state management
    	let focus = false;

    	let handleActivated = false;
    	let handlePressed = false;
    	let keyboardActive = false;
    	let activeHandle = values.length - 1;
    	let startValue;
    	let previousValue;

    	// copy the initial values in to a spring function which
    	// will update every time the values array is modified
    	let springPositions;

    	

    	/**
     * check if an element is a handle on the slider
     * @param {object} el dom object reference we want to check
     * @returns {boolean}
     **/
    	function targetIsHandle(el) {
    		const handles = slider.querySelectorAll(".handle");
    		const isHandle = Array.prototype.includes.call(handles, el);
    		const isChild = Array.prototype.some.call(handles, e => e.contains(el));
    		return isHandle || isChild;
    	}

    	/**
     * trim the values array based on whether the property
     * for 'range' is 'min', 'max', or truthy. This is because we
     * do not want more than one handle for a min/max range, and we do
     * not want more than two handles for a true range.
     * @param {array} values the input values for the rangeSlider
     * @return {array} the range array for creating a rangeSlider
     **/
    	function trimRange(values) {
    		if (range === "min" || range === "max") {
    			return values.slice(0, 1);
    		} else if (range) {
    			return values.slice(0, 2);
    		} else {
    			return values;
    		}
    	}

    	/**
     * helper to return the slider dimensions for finding
     * the closest handle to user interaction
     * @return {object} the range slider DOM client rect
     **/
    	function getSliderDimensions() {
    		return slider.getBoundingClientRect();
    	}

    	/**
     * helper to return closest handle to user interaction
     * @param {object} clientPos the client{x,y} positions to check against
     * @return {number} the index of the closest handle to clientPos
     **/
    	function getClosestHandle(clientPos) {
    		// first make sure we have the latest dimensions
    		// of the slider, as it may have changed size
    		const dims = getSliderDimensions();

    		// calculate the interaction position, percent and value
    		let hPos = 0;

    		let hPercent = 0;
    		let hVal = 0;

    		if (vertical) {
    			hPos = clientPos.clientY - dims.top;
    			hPercent = hPos / dims.height * 100;
    			hVal = (max - min) / 100 * hPercent + min;
    		} else {
    			hPos = clientPos.clientX - dims.left;
    			hPercent = hPos / dims.width * 100;
    			hVal = (max - min) / 100 * hPercent + min;
    		}

    		let closest;

    		// if we have a range, and the handles are at the same
    		// position, we want a simple check if the interaction
    		// value is greater than return the second handle
    		if (range === true && values[0] === values[1]) {
    			if (hVal > values[1]) {
    				return 1;
    			} else {
    				return 0;
    			}
    		} else // we sort the handles values, and return the first one closest
    		// to the interaction value
    		{
    			closest = values.indexOf([...values].sort((a, b) => Math.abs(hVal - a) - Math.abs(hVal - b))[0]); // if there are multiple handles, and not a range, then
    		}

    		return closest;
    	}

    	/**
     * take the interaction position on the slider, convert
     * it to a value on the range, and then send that value
     * through to the moveHandle() method to set the active
     * handle's position
     * @param {object} clientPos the client{x,y} of the interaction
     **/
    	function handleInteract(clientPos) {
    		// first make sure we have the latest dimensions
    		// of the slider, as it may have changed size
    		const dims = getSliderDimensions();

    		// calculate the interaction position, percent and value
    		let hPos = 0;

    		let hPercent = 0;
    		let hVal = 0;

    		if (vertical) {
    			hPos = clientPos.clientY - dims.top;
    			hPercent = hPos / dims.height * 100;
    			hVal = (max - min) / 100 * hPercent + min;
    		} else {
    			hPos = clientPos.clientX - dims.left;
    			hPercent = hPos / dims.width * 100;
    			hVal = (max - min) / 100 * hPercent + min;
    		}

    		// move handle to the value
    		moveHandle(activeHandle, hVal);
    	}

    	/**
     * move a handle to a specific value, respecting the clamp/align rules
     * @param {number} index the index of the handle we want to move
     * @param {number} value the value to move the handle to
     * @return {number} the value that was moved to (after alignment/clamping)
     **/
    	function moveHandle(index, value) {
    		// align & clamp the value so we're not doing extra
    		// calculation on an out-of-range value down below
    		value = alignValueToStep(value);

    		// if this is a range slider
    		if (range) {
    			// restrict the handles of a range-slider from
    			// going past one-another unless "pushy" is true
    			if (index === 0 && value > values[1]) {
    				if (pushy) {
    					$$invalidate(0, values[1] = value, values);
    				} else {
    					value = values[1];
    				}
    			} else if (index === 1 && value < values[0]) {
    				if (pushy) {
    					$$invalidate(0, values[0] = value, values);
    				} else {
    					value = values[0];
    				}
    			}
    		}

    		// if the value has changed, update it
    		if (values[index] !== value) {
    			$$invalidate(0, values[index] = value, values);
    		}

    		// fire the change event when the handle moves,
    		// and store the previous value for the next time
    		if (previousValue !== value) {
    			eChange();
    			previousValue = value;
    		}
    	}

    	/**
     * helper to find the beginning range value for use with css style
     * @param {array} values the input values for the rangeSlider
     * @return {number} the beginning of the range
     **/
    	function rangeStart(values) {
    		if (range === "min") {
    			return 0;
    		} else {
    			return values[0];
    		}
    	}

    	/**
     * helper to find the ending range value for use with css style
     * @param {array} values the input values for the rangeSlider
     * @return {number} the end of the range
     **/
    	function rangeEnd(values) {
    		if (range === "max") {
    			return 0;
    		} else if (range === "min") {
    			return 100 - values[0];
    		} else {
    			return 100 - values[1];
    		}
    	}

    	/**
     * when the user has unfocussed (blurred) from the
     * slider, deactivated all handles
     * @param {event} e the event from browser
     **/
    	function sliderBlurHandle(e) {
    		if (keyboardActive) {
    			$$invalidate(23, focus = false);
    			handleActivated = false;
    			$$invalidate(24, handlePressed = false);
    		}
    	}

    	/**
     * when the user focusses the handle of a slider
     * set it to be active
     * @param {event} e the event from browser
     **/
    	function sliderFocusHandle(e) {
    		if (!disabled) {
    			$$invalidate(25, activeHandle = index(e.target));
    			$$invalidate(23, focus = true);
    		}
    	}

    	/**
     * handle the keyboard accessible features by checking the
     * input type, and modfier key then moving handle by appropriate amount
     * @param {event} e the event from browser
     **/
    	function sliderKeydown(e) {
    		if (!disabled) {
    			const handle = index(e.target);
    			let jump = e.ctrlKey || e.metaKey || e.shiftKey ? step * 10 : step;
    			let prevent = false;

    			switch (e.key) {
    				case "PageDown":
    					jump *= 10;
    				case "ArrowRight":
    				case "ArrowUp":
    					moveHandle(handle, values[handle] + jump);
    					prevent = true;
    					break;
    				case "PageUp":
    					jump *= 10;
    				case "ArrowLeft":
    				case "ArrowDown":
    					moveHandle(handle, values[handle] - jump);
    					prevent = true;
    					break;
    				case "Home":
    					moveHandle(handle, min);
    					prevent = true;
    					break;
    				case "End":
    					moveHandle(handle, max);
    					prevent = true;
    					break;
    			}

    			if (prevent) {
    				e.preventDefault();
    				e.stopPropagation();
    			}
    		}
    	}

    	/**
     * function to run when the user touches
     * down on the slider element anywhere
     * @param {event} e the event from browser
     **/
    	function sliderInteractStart(e) {
    		if (!disabled) {
    			const clientPos = normalisedClient(e);

    			// set the closest handle as active
    			$$invalidate(23, focus = true);

    			handleActivated = true;
    			$$invalidate(24, handlePressed = true);
    			$$invalidate(25, activeHandle = getClosestHandle(clientPos));

    			// fire the start event
    			startValue = previousValue = alignValueToStep(values[activeHandle]);

    			eStart();

    			// for touch devices we want the handle to instantly
    			// move to the position touched for more responsive feeling
    			if (e.type === "touchstart") {
    				handleInteract(clientPos);
    			}
    		}
    	}

    	/**
     * function to run when the user stops touching
     * down on the slider element anywhere
     * @param {event} e the event from browser
     **/
    	function sliderInteractEnd(e) {
    		// fire the stop event for touch devices
    		if (e.type === "touchend") {
    			eStop();
    		}

    		$$invalidate(24, handlePressed = false);
    	}

    	/**
     * unfocus the slider if the user clicked off of
     * it, somewhere else on the screen
     * @param {event} e the event from browser
     **/
    	function bodyInteractStart(e) {
    		keyboardActive = false;

    		if (focus && e.target !== slider && !slider.contains(e.target)) {
    			$$invalidate(23, focus = false);
    		}
    	}

    	/**
     * send the clientX through to handle the interaction
     * whenever the user moves acros screen while active
     * @param {event} e the event from browser
     **/
    	function bodyInteract(e) {
    		if (!disabled) {
    			if (handleActivated) {
    				handleInteract(normalisedClient(e));
    			}
    		}
    	}

    	/**
     * if user triggers mouseup on the body while
     * a handle is active (without moving) then we
     * trigger an interact event there
     * @param {event} e the event from browser
     **/
    	function bodyMouseUp(e) {
    		if (!disabled) {
    			const el = e.target;

    			// this only works if a handle is active, which can
    			// only happen if there was sliderInteractStart triggered
    			// on the slider, already
    			if (handleActivated) {
    				if (el === slider || slider.contains(el)) {
    					$$invalidate(23, focus = true);

    					if (!targetIsHandle(el)) {
    						handleInteract(normalisedClient(e));
    					}
    				}

    				// fire the stop event for mouse device
    				// when the body is triggered with an active handle
    				eStop();
    			}
    		}

    		handleActivated = false;
    		$$invalidate(24, handlePressed = false);
    	}

    	/**
     * if user triggers touchend on the body then we
     * defocus the slider completely
     * @param {event} e the event from browser
     **/
    	function bodyTouchEnd(e) {
    		handleActivated = false;
    		$$invalidate(24, handlePressed = false);
    	}

    	function bodyKeyDown(e) {
    		if (!disabled) {
    			if (e.target === slider || slider.contains(e.target)) {
    				keyboardActive = true;
    			}
    		}
    	}

    	function eStart() {
    		!disabled && dispatch("start", {
    			activeHandle,
    			value: startValue,
    			values: values.map(v => alignValueToStep(v))
    		});
    	}

    	function eStop() {
    		!disabled && dispatch("stop", {
    			activeHandle,
    			startValue,
    			value: values[activeHandle],
    			values: values.map(v => alignValueToStep(v))
    		});
    	}

    	function eChange() {
    		!disabled && dispatch("change", {
    			activeHandle,
    			startValue,
    			previousValue: typeof previousValue === "undefined"
    			? startValue
    			: previousValue,
    			value: values[activeHandle],
    			values: values.map(v => alignValueToStep(v))
    		});
    	}

    	const writable_props = [
    		"range",
    		"pushy",
    		"min",
    		"max",
    		"step",
    		"values",
    		"vertical",
    		"float",
    		"hover",
    		"disabled",
    		"pips",
    		"pipstep",
    		"all",
    		"first",
    		"last",
    		"rest",
    		"id",
    		"prefix",
    		"suffix",
    		"formatter",
    		"handleFormatter",
    		"precision",
    		"springValues"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<RangeSlider> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			slider = $$value;
    			$$invalidate(22, slider);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("range" in $$props) $$invalidate(1, range = $$props.range);
    		if ("pushy" in $$props) $$invalidate(39, pushy = $$props.pushy);
    		if ("min" in $$props) $$invalidate(2, min = $$props.min);
    		if ("max" in $$props) $$invalidate(3, max = $$props.max);
    		if ("step" in $$props) $$invalidate(4, step = $$props.step);
    		if ("values" in $$props) $$invalidate(0, values = $$props.values);
    		if ("vertical" in $$props) $$invalidate(5, vertical = $$props.vertical);
    		if ("float" in $$props) $$invalidate(6, float = $$props.float);
    		if ("hover" in $$props) $$invalidate(7, hover = $$props.hover);
    		if ("disabled" in $$props) $$invalidate(8, disabled = $$props.disabled);
    		if ("pips" in $$props) $$invalidate(9, pips = $$props.pips);
    		if ("pipstep" in $$props) $$invalidate(10, pipstep = $$props.pipstep);
    		if ("all" in $$props) $$invalidate(11, all = $$props.all);
    		if ("first" in $$props) $$invalidate(12, first = $$props.first);
    		if ("last" in $$props) $$invalidate(13, last = $$props.last);
    		if ("rest" in $$props) $$invalidate(14, rest = $$props.rest);
    		if ("id" in $$props) $$invalidate(15, id = $$props.id);
    		if ("prefix" in $$props) $$invalidate(16, prefix = $$props.prefix);
    		if ("suffix" in $$props) $$invalidate(17, suffix = $$props.suffix);
    		if ("formatter" in $$props) $$invalidate(18, formatter = $$props.formatter);
    		if ("handleFormatter" in $$props) $$invalidate(19, handleFormatter = $$props.handleFormatter);
    		if ("precision" in $$props) $$invalidate(40, precision = $$props.precision);
    		if ("springValues" in $$props) $$invalidate(41, springValues = $$props.springValues);
    	};

    	$$self.$capture_state = () => ({
    		spring,
    		createEventDispatcher,
    		RangePips,
    		range,
    		pushy,
    		min,
    		max,
    		step,
    		values,
    		vertical,
    		float,
    		hover,
    		disabled,
    		pips,
    		pipstep,
    		all,
    		first,
    		last,
    		rest,
    		id,
    		prefix,
    		suffix,
    		formatter,
    		handleFormatter,
    		precision,
    		springValues,
    		dispatch,
    		slider,
    		focus,
    		handleActivated,
    		handlePressed,
    		keyboardActive,
    		activeHandle,
    		startValue,
    		previousValue,
    		springPositions,
    		index,
    		normalisedClient,
    		targetIsHandle,
    		trimRange,
    		getSliderDimensions,
    		getClosestHandle,
    		handleInteract,
    		moveHandle,
    		rangeStart,
    		rangeEnd,
    		sliderBlurHandle,
    		sliderFocusHandle,
    		sliderKeydown,
    		sliderInteractStart,
    		sliderInteractEnd,
    		bodyInteractStart,
    		bodyInteract,
    		bodyMouseUp,
    		bodyTouchEnd,
    		bodyKeyDown,
    		eStart,
    		eStop,
    		eChange,
    		alignValueToStep,
    		percentOf,
    		clampValue,
    		$springPositions
    	});

    	$$self.$inject_state = $$props => {
    		if ("range" in $$props) $$invalidate(1, range = $$props.range);
    		if ("pushy" in $$props) $$invalidate(39, pushy = $$props.pushy);
    		if ("min" in $$props) $$invalidate(2, min = $$props.min);
    		if ("max" in $$props) $$invalidate(3, max = $$props.max);
    		if ("step" in $$props) $$invalidate(4, step = $$props.step);
    		if ("values" in $$props) $$invalidate(0, values = $$props.values);
    		if ("vertical" in $$props) $$invalidate(5, vertical = $$props.vertical);
    		if ("float" in $$props) $$invalidate(6, float = $$props.float);
    		if ("hover" in $$props) $$invalidate(7, hover = $$props.hover);
    		if ("disabled" in $$props) $$invalidate(8, disabled = $$props.disabled);
    		if ("pips" in $$props) $$invalidate(9, pips = $$props.pips);
    		if ("pipstep" in $$props) $$invalidate(10, pipstep = $$props.pipstep);
    		if ("all" in $$props) $$invalidate(11, all = $$props.all);
    		if ("first" in $$props) $$invalidate(12, first = $$props.first);
    		if ("last" in $$props) $$invalidate(13, last = $$props.last);
    		if ("rest" in $$props) $$invalidate(14, rest = $$props.rest);
    		if ("id" in $$props) $$invalidate(15, id = $$props.id);
    		if ("prefix" in $$props) $$invalidate(16, prefix = $$props.prefix);
    		if ("suffix" in $$props) $$invalidate(17, suffix = $$props.suffix);
    		if ("formatter" in $$props) $$invalidate(18, formatter = $$props.formatter);
    		if ("handleFormatter" in $$props) $$invalidate(19, handleFormatter = $$props.handleFormatter);
    		if ("precision" in $$props) $$invalidate(40, precision = $$props.precision);
    		if ("springValues" in $$props) $$invalidate(41, springValues = $$props.springValues);
    		if ("slider" in $$props) $$invalidate(22, slider = $$props.slider);
    		if ("focus" in $$props) $$invalidate(23, focus = $$props.focus);
    		if ("handleActivated" in $$props) handleActivated = $$props.handleActivated;
    		if ("handlePressed" in $$props) $$invalidate(24, handlePressed = $$props.handlePressed);
    		if ("keyboardActive" in $$props) keyboardActive = $$props.keyboardActive;
    		if ("activeHandle" in $$props) $$invalidate(25, activeHandle = $$props.activeHandle);
    		if ("startValue" in $$props) startValue = $$props.startValue;
    		if ("previousValue" in $$props) previousValue = $$props.previousValue;
    		if ("springPositions" in $$props) $$subscribe_springPositions($$invalidate(20, springPositions = $$props.springPositions));
    		if ("alignValueToStep" in $$props) $$invalidate(42, alignValueToStep = $$props.alignValueToStep);
    		if ("percentOf" in $$props) $$invalidate(21, percentOf = $$props.percentOf);
    		if ("clampValue" in $$props) $$invalidate(43, clampValue = $$props.clampValue);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*min, max*/ 12) {
    			/**
     * clamp a value from the range so that it always
     * falls within the min/max values
     * @param {number} val the value to clamp
     * @return {number} the value after it's been clamped
     **/
    			$$invalidate(43, clampValue = function (val) {
    				// return the min/max if outside of that range
    				return val <= min ? min : val >= max ? max : val;
    			});
    		}

    		if ($$self.$$.dirty[0] & /*min, max, step*/ 28 | $$self.$$.dirty[1] & /*clampValue, precision*/ 4608) {
    			/**
     * align the value with the steps so that it
     * always sits on the closest (above/below) step
     * @param {number} val the value to align
     * @return {number} the value after it's been aligned
     **/
    			$$invalidate(42, alignValueToStep = function (val) {
    				// sanity check for performance
    				if (val <= min) {
    					return min;
    				} else if (val >= max) {
    					return max;
    				}

    				// find the middle-point between steps
    				// and see if the value is closer to the
    				// next step, or previous step
    				let remainder = (val - min) % step;

    				let aligned = val - remainder;

    				if (Math.abs(remainder) * 2 >= step) {
    					aligned += remainder > 0 ? step : -step;
    				}

    				// make sure the value is within acceptable limits
    				aligned = clampValue(aligned);

    				// make sure the returned value is set to the precision desired
    				// this is also because javascript often returns weird floats
    				// when dealing with odd numbers and percentages
    				return parseFloat(aligned.toFixed(precision));
    			});
    		}

    		if ($$self.$$.dirty[0] & /*min, max*/ 12 | $$self.$$.dirty[1] & /*precision*/ 512) {
    			/**
     * take in a value, and then calculate that value's percentage
     * of the overall range (min-max);
     * @param {number} val the value we're getting percent for
     * @return {number} the percentage value
     **/
    			$$invalidate(21, percentOf = function (val) {
    				let perc = (val - min) / (max - min) * 100;

    				if (isNaN(perc) || perc <= 0) {
    					return 0;
    				} else if (perc >= 100) {
    					return 100;
    				} else {
    					return parseFloat(perc.toFixed(precision));
    				}
    			});
    		}

    		if ($$self.$$.dirty[0] & /*values, max, min, springPositions, percentOf*/ 3145741 | $$self.$$.dirty[1] & /*alignValueToStep, springValues*/ 3072) {
    			{
    				// check that "values" is an array, or set it as array
    				// to prevent any errors in springs, or range trimming
    				if (!Array.isArray(values)) {
    					$$invalidate(0, values = [(max + min) / 2]);
    					console.error("'values' prop should be an Array (https://github.com/simeydotme/svelte-range-slider-pips#slider-props)");
    				}

    				// trim the range as needed
    				$$invalidate(0, values = trimRange(values));

    				// clamp the values to the steps and boundaries set up in the slider
    				$$invalidate(0, values = values.map(v => alignValueToStep(v)));

    				// update the spring function so that movement can happen in the UI
    				if (springPositions) {
    					springPositions.set(values.map(v => percentOf(v)));
    				} else {
    					$$subscribe_springPositions($$invalidate(20, springPositions = spring(values.map(v => percentOf(v)), springValues)));
    				}
    			}
    		}
    	};

    	return [
    		values,
    		range,
    		min,
    		max,
    		step,
    		vertical,
    		float,
    		hover,
    		disabled,
    		pips,
    		pipstep,
    		all,
    		first,
    		last,
    		rest,
    		id,
    		prefix,
    		suffix,
    		formatter,
    		handleFormatter,
    		springPositions,
    		percentOf,
    		slider,
    		focus,
    		handlePressed,
    		activeHandle,
    		$springPositions,
    		rangeStart,
    		rangeEnd,
    		sliderBlurHandle,
    		sliderFocusHandle,
    		sliderKeydown,
    		sliderInteractStart,
    		sliderInteractEnd,
    		bodyInteractStart,
    		bodyInteract,
    		bodyMouseUp,
    		bodyTouchEnd,
    		bodyKeyDown,
    		pushy,
    		precision,
    		springValues,
    		alignValueToStep,
    		clampValue,
    		div_binding
    	];
    }

    class RangeSlider extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$4,
    			create_fragment$4,
    			safe_not_equal,
    			{
    				range: 1,
    				pushy: 39,
    				min: 2,
    				max: 3,
    				step: 4,
    				values: 0,
    				vertical: 5,
    				float: 6,
    				hover: 7,
    				disabled: 8,
    				pips: 9,
    				pipstep: 10,
    				all: 11,
    				first: 12,
    				last: 13,
    				rest: 14,
    				id: 15,
    				prefix: 16,
    				suffix: 17,
    				formatter: 18,
    				handleFormatter: 19,
    				precision: 40,
    				springValues: 41
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RangeSlider",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get range() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set range(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pushy() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pushy(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get min() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set min(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get max() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set max(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get step() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set step(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get values() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set values(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get vertical() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set vertical(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get float() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set float(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hover() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hover(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pips() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pips(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pipstep() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pipstep(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get all() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set all(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get first() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set first(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get last() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set last(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rest() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rest(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get suffix() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set suffix(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get formatter() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set formatter(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleFormatter() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handleFormatter(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get precision() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set precision(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get springValues() {
    		throw new Error("<RangeSlider>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set springValues(value) {
    		throw new Error("<RangeSlider>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Sliders.svelte generated by Svelte v3.35.0 */
    const file$3 = "src\\components\\Sliders.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let rangeslider0;
    	let t0;
    	let rangeslider1;
    	let t1;
    	let rangeslider2;
    	let t2;
    	let rangeslider3;
    	let t3;
    	let rangeslider4;
    	let t4;
    	let rangeslider5;
    	let t5;
    	let rangeslider6;
    	let t6;
    	let rangeslider7;
    	let current;

    	rangeslider0 = new RangeSlider({
    			props: {
    				pips: true,
    				min: 0,
    				max: 127,
    				values: [/*vals*/ ctx[0][0]],
    				vertical: "true"
    			},
    			$$inline: true
    		});

    	rangeslider1 = new RangeSlider({
    			props: {
    				pips: true,
    				min: 0,
    				max: 127,
    				values: [/*vals*/ ctx[0][1]],
    				vertical: "true"
    			},
    			$$inline: true
    		});

    	rangeslider2 = new RangeSlider({
    			props: {
    				pips: true,
    				min: 0,
    				max: 127,
    				values: [/*vals*/ ctx[0][2]],
    				vertical: "true"
    			},
    			$$inline: true
    		});

    	rangeslider3 = new RangeSlider({
    			props: {
    				pips: true,
    				min: 0,
    				max: 127,
    				values: [/*vals*/ ctx[0][3]],
    				vertical: "true"
    			},
    			$$inline: true
    		});

    	rangeslider4 = new RangeSlider({
    			props: {
    				pips: true,
    				min: 0,
    				max: 127,
    				values: [/*vals*/ ctx[0][4]],
    				vertical: "true"
    			},
    			$$inline: true
    		});

    	rangeslider5 = new RangeSlider({
    			props: {
    				pips: true,
    				min: 0,
    				max: 127,
    				values: [/*vals*/ ctx[0][5]],
    				vertical: "true"
    			},
    			$$inline: true
    		});

    	rangeslider6 = new RangeSlider({
    			props: {
    				pips: true,
    				min: 0,
    				max: 127,
    				values: [/*vals*/ ctx[0][6]],
    				vertical: "true"
    			},
    			$$inline: true
    		});

    	rangeslider7 = new RangeSlider({
    			props: {
    				pips: true,
    				min: 0,
    				max: 127,
    				values: [/*vals*/ ctx[0][7]],
    				vertical: "true"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(rangeslider0.$$.fragment);
    			t0 = space();
    			create_component(rangeslider1.$$.fragment);
    			t1 = space();
    			create_component(rangeslider2.$$.fragment);
    			t2 = space();
    			create_component(rangeslider3.$$.fragment);
    			t3 = space();
    			create_component(rangeslider4.$$.fragment);
    			t4 = space();
    			create_component(rangeslider5.$$.fragment);
    			t5 = space();
    			create_component(rangeslider6.$$.fragment);
    			t6 = space();
    			create_component(rangeslider7.$$.fragment);
    			attr_dev(div, "class", "flex");
    			add_location(div, file$3, 4, 0, 138);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(rangeslider0, div, null);
    			append_dev(div, t0);
    			mount_component(rangeslider1, div, null);
    			append_dev(div, t1);
    			mount_component(rangeslider2, div, null);
    			append_dev(div, t2);
    			mount_component(rangeslider3, div, null);
    			append_dev(div, t3);
    			mount_component(rangeslider4, div, null);
    			append_dev(div, t4);
    			mount_component(rangeslider5, div, null);
    			append_dev(div, t5);
    			mount_component(rangeslider6, div, null);
    			append_dev(div, t6);
    			mount_component(rangeslider7, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(rangeslider0.$$.fragment, local);
    			transition_in(rangeslider1.$$.fragment, local);
    			transition_in(rangeslider2.$$.fragment, local);
    			transition_in(rangeslider3.$$.fragment, local);
    			transition_in(rangeslider4.$$.fragment, local);
    			transition_in(rangeslider5.$$.fragment, local);
    			transition_in(rangeslider6.$$.fragment, local);
    			transition_in(rangeslider7.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(rangeslider0.$$.fragment, local);
    			transition_out(rangeslider1.$$.fragment, local);
    			transition_out(rangeslider2.$$.fragment, local);
    			transition_out(rangeslider3.$$.fragment, local);
    			transition_out(rangeslider4.$$.fragment, local);
    			transition_out(rangeslider5.$$.fragment, local);
    			transition_out(rangeslider6.$$.fragment, local);
    			transition_out(rangeslider7.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(rangeslider0);
    			destroy_component(rangeslider1);
    			destroy_component(rangeslider2);
    			destroy_component(rangeslider3);
    			destroy_component(rangeslider4);
    			destroy_component(rangeslider5);
    			destroy_component(rangeslider6);
    			destroy_component(rangeslider7);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Sliders", slots, []);
    	let vals = [0, 10, 35, 64, 78, 20, 34, 120];
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Sliders> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ RangeSlider, vals });

    	$$self.$inject_state = $$props => {
    		if ("vals" in $$props) $$invalidate(0, vals = $$props.vals);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [vals];
    }

    class Sliders extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sliders",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\components\Test.svelte generated by Svelte v3.35.0 */

    const file$2 = "src\\components\\Test.svelte";

    function create_fragment$2(ctx) {
    	let t;
    	let div;

    	const block = {
    		c: function create() {
    			t = text("Hello Test\r\n\r\n");
    			div = element("div");
    			attr_dev(div, "class", "npknob");
    			add_location(div, file$2, 4, 0, 53);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Test", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Test> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Test extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Test",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    var nipplejs = createCommonjsModule(function (module, exports) {
    !function(t,i){module.exports=i();}(window,function(){return function(t){var i={};function e(o){if(i[o])return i[o].exports;var n=i[o]={i:o,l:!1,exports:{}};return t[o].call(n.exports,n,n.exports,e),n.l=!0,n.exports}return e.m=t,e.c=i,e.d=function(t,i,o){e.o(t,i)||Object.defineProperty(t,i,{enumerable:!0,get:o});},e.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0});},e.t=function(t,i){if(1&i&&(t=e(t)),8&i)return t;if(4&i&&"object"==typeof t&&t&&t.__esModule)return t;var o=Object.create(null);if(e.r(o),Object.defineProperty(o,"default",{enumerable:!0,value:t}),2&i&&"string"!=typeof t)for(var n in t)e.d(o,n,function(i){return t[i]}.bind(null,n));return o},e.n=function(t){var i=t&&t.__esModule?function(){return t.default}:function(){return t};return e.d(i,"a",i),i},e.o=function(t,i){return Object.prototype.hasOwnProperty.call(t,i)},e.p="",e(e.s=0)}([function(t,i,e){e.r(i);var o,n=function(t,i){var e=i.x-t.x,o=i.y-t.y;return Math.sqrt(e*e+o*o)},s=function(t){return t*(Math.PI/180)},r=function(t){return t*(180/Math.PI)},d=new Map,a=function(t){d.has(t)&&clearTimeout(d.get(t)),d.set(t,setTimeout(t,100));},p=function(t,i,e){for(var o,n=i.split(/[ ,]+/g),s=0;s<n.length;s+=1)o=n[s],t.addEventListener?t.addEventListener(o,e,!1):t.attachEvent&&t.attachEvent(o,e);},c=function(t,i,e){for(var o,n=i.split(/[ ,]+/g),s=0;s<n.length;s+=1)o=n[s],t.removeEventListener?t.removeEventListener(o,e):t.detachEvent&&t.detachEvent(o,e);},l=function(t){return t.preventDefault(),t.type.match(/^touch/)?t.changedTouches:t},h=function(){return {x:void 0!==window.pageXOffset?window.pageXOffset:(document.documentElement||document.body.parentNode||document.body).scrollLeft,y:void 0!==window.pageYOffset?window.pageYOffset:(document.documentElement||document.body.parentNode||document.body).scrollTop}},u=function(t,i){i.top||i.right||i.bottom||i.left?(t.style.top=i.top,t.style.right=i.right,t.style.bottom=i.bottom,t.style.left=i.left):(t.style.left=i.x+"px",t.style.top=i.y+"px");},f=function(t,i,e){var o=y(t);for(var n in o)if(o.hasOwnProperty(n))if("string"==typeof i)o[n]=i+" "+e;else {for(var s="",r=0,d=i.length;r<d;r+=1)s+=i[r]+" "+e+", ";o[n]=s.slice(0,-2);}return o},y=function(t){var i={};i[t]="";return ["webkit","Moz","o"].forEach(function(e){i[e+t.charAt(0).toUpperCase()+t.slice(1)]="";}),i},m=function(t,i){for(var e in i)i.hasOwnProperty(e)&&(t[e]=i[e]);return t},v=function(t,i){if(t.length)for(var e=0,o=t.length;e<o;e+=1)i(t[e]);else i(t);},g=!!("ontouchstart"in window),b=!!window.PointerEvent,x=!!window.MSPointerEvent,O={start:"mousedown",move:"mousemove",end:"mouseup"},w={};function _(){}b?o={start:"pointerdown",move:"pointermove",end:"pointerup, pointercancel"}:x?o={start:"MSPointerDown",move:"MSPointerMove",end:"MSPointerUp"}:g?(o={start:"touchstart",move:"touchmove",end:"touchend, touchcancel"},w=O):o=O,_.prototype.on=function(t,i){var e,o=t.split(/[ ,]+/g);this._handlers_=this._handlers_||{};for(var n=0;n<o.length;n+=1)e=o[n],this._handlers_[e]=this._handlers_[e]||[],this._handlers_[e].push(i);return this},_.prototype.off=function(t,i){return this._handlers_=this._handlers_||{},void 0===t?this._handlers_={}:void 0===i?this._handlers_[t]=null:this._handlers_[t]&&this._handlers_[t].indexOf(i)>=0&&this._handlers_[t].splice(this._handlers_[t].indexOf(i),1),this},_.prototype.trigger=function(t,i){var e,o=this,n=t.split(/[ ,]+/g);o._handlers_=o._handlers_||{};for(var s=0;s<n.length;s+=1)e=n[s],o._handlers_[e]&&o._handlers_[e].length&&o._handlers_[e].forEach(function(t){t.call(o,{type:e,target:o},i);});},_.prototype.config=function(t){this.options=this.defaults||{},t&&(this.options=function(t,i){var e={};for(var o in t)t.hasOwnProperty(o)&&i.hasOwnProperty(o)?e[o]=i[o]:t.hasOwnProperty(o)&&(e[o]=t[o]);return e}(this.options,t));},_.prototype.bindEvt=function(t,i){var e=this;return e._domHandlers_=e._domHandlers_||{},e._domHandlers_[i]=function(){"function"==typeof e["on"+i]?e["on"+i].apply(e,arguments):console.warn('[WARNING] : Missing "on'+i+'" handler.');},p(t,o[i],e._domHandlers_[i]),w[i]&&p(t,w[i],e._domHandlers_[i]),e},_.prototype.unbindEvt=function(t,i){return this._domHandlers_=this._domHandlers_||{},c(t,o[i],this._domHandlers_[i]),w[i]&&c(t,w[i],this._domHandlers_[i]),delete this._domHandlers_[i],this};var T=_;function k(t,i){return this.identifier=i.identifier,this.position=i.position,this.frontPosition=i.frontPosition,this.collection=t,this.defaults={size:100,threshold:.1,color:"white",fadeTime:250,dataOnly:!1,restJoystick:!0,restOpacity:.5,mode:"dynamic",zone:document.body,lockX:!1,lockY:!1,shape:"circle"},this.config(i),"dynamic"===this.options.mode&&(this.options.restOpacity=0),this.id=k.id,k.id+=1,this.buildEl().stylize(),this.instance={el:this.ui.el,on:this.on.bind(this),off:this.off.bind(this),show:this.show.bind(this),hide:this.hide.bind(this),add:this.addToDom.bind(this),remove:this.removeFromDom.bind(this),destroy:this.destroy.bind(this),setPosition:this.setPosition.bind(this),resetDirection:this.resetDirection.bind(this),computeDirection:this.computeDirection.bind(this),trigger:this.trigger.bind(this),position:this.position,frontPosition:this.frontPosition,ui:this.ui,identifier:this.identifier,id:this.id,options:this.options},this.instance}k.prototype=new T,k.constructor=k,k.id=0,k.prototype.buildEl=function(t){return this.ui={},this.options.dataOnly?this:(this.ui.el=document.createElement("div"),this.ui.back=document.createElement("div"),this.ui.front=document.createElement("div"),this.ui.el.className="nipple collection_"+this.collection.id,this.ui.back.className="back",this.ui.front.className="front",this.ui.el.setAttribute("id","nipple_"+this.collection.id+"_"+this.id),this.ui.el.appendChild(this.ui.back),this.ui.el.appendChild(this.ui.front),this)},k.prototype.stylize=function(){if(this.options.dataOnly)return this;var t=this.options.fadeTime+"ms",i=function(t,i){var e=y(t);for(var o in e)e.hasOwnProperty(o)&&(e[o]=i);return e}("borderRadius","50%"),e=f("transition","opacity",t),o={};return o.el={position:"absolute",opacity:this.options.restOpacity,display:"block",zIndex:999},o.back={position:"absolute",display:"block",width:this.options.size+"px",height:this.options.size+"px",marginLeft:-this.options.size/2+"px",marginTop:-this.options.size/2+"px",background:this.options.color,opacity:".5"},o.front={width:this.options.size/2+"px",height:this.options.size/2+"px",position:"absolute",display:"block",marginLeft:-this.options.size/4+"px",marginTop:-this.options.size/4+"px",background:this.options.color,opacity:".5"},m(o.el,e),"circle"===this.options.shape&&m(o.back,i),m(o.front,i),this.applyStyles(o),this},k.prototype.applyStyles=function(t){for(var i in this.ui)if(this.ui.hasOwnProperty(i))for(var e in t[i])this.ui[i].style[e]=t[i][e];return this},k.prototype.addToDom=function(){return this.options.dataOnly||document.body.contains(this.ui.el)?this:(this.options.zone.appendChild(this.ui.el),this)},k.prototype.removeFromDom=function(){return this.options.dataOnly||!document.body.contains(this.ui.el)?this:(this.options.zone.removeChild(this.ui.el),this)},k.prototype.destroy=function(){clearTimeout(this.removeTimeout),clearTimeout(this.showTimeout),clearTimeout(this.restTimeout),this.trigger("destroyed",this.instance),this.removeFromDom(),this.off();},k.prototype.show=function(t){var i=this;return i.options.dataOnly?i:(clearTimeout(i.removeTimeout),clearTimeout(i.showTimeout),clearTimeout(i.restTimeout),i.addToDom(),i.restCallback(),setTimeout(function(){i.ui.el.style.opacity=1;},0),i.showTimeout=setTimeout(function(){i.trigger("shown",i.instance),"function"==typeof t&&t.call(this);},i.options.fadeTime),i)},k.prototype.hide=function(t){var i=this;return i.options.dataOnly?i:(i.ui.el.style.opacity=i.options.restOpacity,clearTimeout(i.removeTimeout),clearTimeout(i.showTimeout),clearTimeout(i.restTimeout),i.removeTimeout=setTimeout(function(){var e="dynamic"===i.options.mode?"none":"block";i.ui.el.style.display=e,"function"==typeof t&&t.call(i),i.trigger("hidden",i.instance);},i.options.fadeTime),i.options.restJoystick&&i.setPosition(t,{x:0,y:0}),i)},k.prototype.setPosition=function(t,i){var e=this;e.frontPosition={x:i.x,y:i.y};var o=e.options.fadeTime+"ms",n={};n.front=f("transition",["top","left"],o);var s={front:{}};s.front={left:e.frontPosition.x+"px",top:e.frontPosition.y+"px"},e.applyStyles(n),e.applyStyles(s),e.restTimeout=setTimeout(function(){"function"==typeof t&&t.call(e),e.restCallback();},e.options.fadeTime);},k.prototype.restCallback=function(){var t={};t.front=f("transition","none",""),this.applyStyles(t),this.trigger("rested",this.instance);},k.prototype.resetDirection=function(){this.direction={x:!1,y:!1,angle:!1};},k.prototype.computeDirection=function(t){var i,e,o,n=t.angle.radian,s=Math.PI/4,r=Math.PI/2;if(n>s&&n<3*s&&!t.lockX?i="up":n>-s&&n<=s&&!t.lockY?i="left":n>3*-s&&n<=-s&&!t.lockX?i="down":t.lockY||(i="right"),t.lockY||(e=n>-r&&n<r?"left":"right"),t.lockX||(o=n>0?"up":"down"),t.force>this.options.threshold){var d,a={};for(d in this.direction)this.direction.hasOwnProperty(d)&&(a[d]=this.direction[d]);var p={};for(d in this.direction={x:e,y:o,angle:i},t.direction=this.direction,a)a[d]===this.direction[d]&&(p[d]=!0);if(p.x&&p.y&&p.angle)return t;p.x&&p.y||this.trigger("plain",t),p.x||this.trigger("plain:"+e,t),p.y||this.trigger("plain:"+o,t),p.angle||this.trigger("dir dir:"+i,t);}else this.resetDirection();return t};var P=k;function E(t,i){return this.nipples=[],this.idles=[],this.actives=[],this.ids=[],this.pressureIntervals={},this.manager=t,this.id=E.id,E.id+=1,this.defaults={zone:document.body,multitouch:!1,maxNumberOfNipples:10,mode:"dynamic",position:{top:0,left:0},catchDistance:200,size:100,threshold:.1,color:"white",fadeTime:250,dataOnly:!1,restJoystick:!0,restOpacity:.5,lockX:!1,lockY:!1,shape:"circle",dynamicPage:!1,follow:!1},this.config(i),"static"!==this.options.mode&&"semi"!==this.options.mode||(this.options.multitouch=!1),this.options.multitouch||(this.options.maxNumberOfNipples=1),this.updateBox(),this.prepareNipples(),this.bindings(),this.begin(),this.nipples}E.prototype=new T,E.constructor=E,E.id=0,E.prototype.prepareNipples=function(){var t=this.nipples;t.on=this.on.bind(this),t.off=this.off.bind(this),t.options=this.options,t.destroy=this.destroy.bind(this),t.ids=this.ids,t.id=this.id,t.processOnMove=this.processOnMove.bind(this),t.processOnEnd=this.processOnEnd.bind(this),t.get=function(i){if(void 0===i)return t[0];for(var e=0,o=t.length;e<o;e+=1)if(t[e].identifier===i)return t[e];return !1};},E.prototype.bindings=function(){this.bindEvt(this.options.zone,"start"),this.options.zone.style.touchAction="none",this.options.zone.style.msTouchAction="none";},E.prototype.begin=function(){var t=this.options;if("static"===t.mode){var i=this.createNipple(t.position,this.manager.getIdentifier());i.add(),this.idles.push(i);}},E.prototype.createNipple=function(t,i){var e=this.manager.scroll,o={},n=this.options;if(t.x&&t.y)o={x:t.x-(e.x+this.box.left),y:t.y-(e.y+this.box.top)};else if(t.top||t.right||t.bottom||t.left){var s=document.createElement("DIV");s.style.display="hidden",s.style.top=t.top,s.style.right=t.right,s.style.bottom=t.bottom,s.style.left=t.left,s.style.position="absolute",n.zone.appendChild(s);var r=s.getBoundingClientRect();n.zone.removeChild(s),o=t,t={x:r.left+e.x,y:r.top+e.y};}var d=new P(this,{color:n.color,size:n.size,threshold:n.threshold,fadeTime:n.fadeTime,dataOnly:n.dataOnly,restJoystick:n.restJoystick,restOpacity:n.restOpacity,mode:n.mode,identifier:i,position:t,zone:n.zone,frontPosition:{x:0,y:0},shape:n.shape});return n.dataOnly||(u(d.ui.el,o),u(d.ui.front,d.frontPosition)),this.nipples.push(d),this.trigger("added "+d.identifier+":added",d),this.manager.trigger("added "+d.identifier+":added",d),this.bindNipple(d),d},E.prototype.updateBox=function(){this.box=this.options.zone.getBoundingClientRect();},E.prototype.bindNipple=function(t){var i,e=this,o=function(t,o){i=t.type+" "+o.id+":"+t.type,e.trigger(i,o);};t.on("destroyed",e.onDestroyed.bind(e)),t.on("shown hidden rested dir plain",o),t.on("dir:up dir:right dir:down dir:left",o),t.on("plain:up plain:right plain:down plain:left",o);},E.prototype.pressureFn=function(t,i,e){var o=this,n=0;clearInterval(o.pressureIntervals[e]),o.pressureIntervals[e]=setInterval(function(){var e=t.force||t.pressure||t.webkitForce||0;e!==n&&(i.trigger("pressure",e),o.trigger("pressure "+i.identifier+":pressure",e),n=e);}.bind(o),100);},E.prototype.onstart=function(t){var i=this,e=i.options,o=t;t=l(t),i.updateBox();return v(t,function(n){i.actives.length<e.maxNumberOfNipples?i.processOnStart(n):o.type.match(/^touch/)&&(Object.keys(i.manager.ids).forEach(function(e){if(Object.values(o.touches).findIndex(function(t){return t.identifier===e})<0){var n=[t[0]];n.identifier=e,i.processOnEnd(n);}}),i.actives.length<e.maxNumberOfNipples&&i.processOnStart(n));}),i.manager.bindDocument(),!1},E.prototype.processOnStart=function(t){var i,e=this,o=e.options,s=e.manager.getIdentifier(t),r=t.force||t.pressure||t.webkitForce||0,d={x:t.pageX,y:t.pageY},a=e.getOrCreate(s,d);a.identifier!==s&&e.manager.removeIdentifier(a.identifier),a.identifier=s;var p=function(i){i.trigger("start",i),e.trigger("start "+i.id+":start",i),i.show(),r>0&&e.pressureFn(t,i,i.identifier),e.processOnMove(t);};if((i=e.idles.indexOf(a))>=0&&e.idles.splice(i,1),e.actives.push(a),e.ids.push(a.identifier),"semi"!==o.mode)p(a);else {if(!(n(d,a.position)<=o.catchDistance))return a.destroy(),void e.processOnStart(t);p(a);}return a},E.prototype.getOrCreate=function(t,i){var e,o=this.options;return /(semi|static)/.test(o.mode)?(e=this.idles[0])?(this.idles.splice(0,1),e):"semi"===o.mode?this.createNipple(i,t):(console.warn("Coudln't find the needed nipple."),!1):e=this.createNipple(i,t)},E.prototype.processOnMove=function(t){var i=this.options,e=this.manager.getIdentifier(t),o=this.nipples.get(e),d=this.manager.scroll;if(function(t){return isNaN(t.buttons)?0!==t.pressure:0!==t.buttons}(t)){if(!o)return console.error("Found zombie joystick with ID "+e),void this.manager.removeIdentifier(e);if(i.dynamicPage){var a=o.el.getBoundingClientRect();o.position={x:d.x+a.left,y:d.y+a.top};}o.identifier=e;var p=o.options.size/2,c={x:t.pageX,y:t.pageY};i.lockX&&(c.y=o.position.y),i.lockY&&(c.x=o.position.x);var l,h,f,y,m,v,g,b,x,O,w=n(c,o.position),_=(l=c,h=o.position,f=h.x-l.x,y=h.y-l.y,r(Math.atan2(y,f))),T=s(_),k=w/p,P={distance:w,position:c};if("circle"===o.options.shape?(m=Math.min(w,p),g=o.position,b=m,O={x:0,y:0},x=s(x=_),O.x=g.x-b*Math.cos(x),O.y=g.y-b*Math.sin(x),v=O):(v=function(t,i,e){return {x:Math.min(Math.max(t.x,i.x-e),i.x+e),y:Math.min(Math.max(t.y,i.y-e),i.y+e)}}(c,o.position,p),m=n(v,o.position)),i.follow){if(w>p){var E=c.x-v.x,I=c.y-v.y;o.position.x+=E,o.position.y+=I,o.el.style.top=o.position.y-(this.box.top+d.y)+"px",o.el.style.left=o.position.x-(this.box.left+d.x)+"px",w=n(c,o.position);}}else c=v,w=m;var z=c.x-o.position.x,D=c.y-o.position.y;o.frontPosition={x:z,y:D},i.dataOnly||u(o.ui.front,o.frontPosition);var M={identifier:o.identifier,position:c,force:k,pressure:t.force||t.pressure||t.webkitForce||0,distance:w,angle:{radian:T,degree:_},vector:{x:z/p,y:-D/p},raw:P,instance:o,lockX:i.lockX,lockY:i.lockY};(M=o.computeDirection(M)).angle={radian:s(180-_),degree:180-_},o.trigger("move",M),this.trigger("move "+o.id+":move",M);}else this.processOnEnd(t);},E.prototype.processOnEnd=function(t){var i=this,e=i.options,o=i.manager.getIdentifier(t),n=i.nipples.get(o),s=i.manager.removeIdentifier(n.identifier);n&&(e.dataOnly||n.hide(function(){"dynamic"===e.mode&&(n.trigger("removed",n),i.trigger("removed "+n.id+":removed",n),i.manager.trigger("removed "+n.id+":removed",n),n.destroy());}),clearInterval(i.pressureIntervals[n.identifier]),n.resetDirection(),n.trigger("end",n),i.trigger("end "+n.id+":end",n),i.ids.indexOf(n.identifier)>=0&&i.ids.splice(i.ids.indexOf(n.identifier),1),i.actives.indexOf(n)>=0&&i.actives.splice(i.actives.indexOf(n),1),/(semi|static)/.test(e.mode)?i.idles.push(n):i.nipples.indexOf(n)>=0&&i.nipples.splice(i.nipples.indexOf(n),1),i.manager.unbindDocument(),/(semi|static)/.test(e.mode)&&(i.manager.ids[s.id]=s.identifier));},E.prototype.onDestroyed=function(t,i){this.nipples.indexOf(i)>=0&&this.nipples.splice(this.nipples.indexOf(i),1),this.actives.indexOf(i)>=0&&this.actives.splice(this.actives.indexOf(i),1),this.idles.indexOf(i)>=0&&this.idles.splice(this.idles.indexOf(i),1),this.ids.indexOf(i.identifier)>=0&&this.ids.splice(this.ids.indexOf(i.identifier),1),this.manager.removeIdentifier(i.identifier),this.manager.unbindDocument();},E.prototype.destroy=function(){for(var t in this.unbindEvt(this.options.zone,"start"),this.nipples.forEach(function(t){t.destroy();}),this.pressureIntervals)this.pressureIntervals.hasOwnProperty(t)&&clearInterval(this.pressureIntervals[t]);this.trigger("destroyed",this.nipples),this.manager.unbindDocument(),this.off();};var I=E;function z(t){var i=this;i.ids={},i.index=0,i.collections=[],i.scroll=h(),i.config(t),i.prepareCollections();var e=function(){var t;i.collections.forEach(function(e){e.forEach(function(e){t=e.el.getBoundingClientRect(),e.position={x:i.scroll.x+t.left,y:i.scroll.y+t.top};});});};p(window,"resize",function(){a(e);});var o=function(){i.scroll=h();};return p(window,"scroll",function(){a(o);}),i.collections}z.prototype=new T,z.constructor=z,z.prototype.prepareCollections=function(){var t=this;t.collections.create=t.create.bind(t),t.collections.on=t.on.bind(t),t.collections.off=t.off.bind(t),t.collections.destroy=t.destroy.bind(t),t.collections.get=function(i){var e;return t.collections.every(function(t){return !(e=t.get(i))}),e};},z.prototype.create=function(t){return this.createCollection(t)},z.prototype.createCollection=function(t){var i=new I(this,t);return this.bindCollection(i),this.collections.push(i),i},z.prototype.bindCollection=function(t){var i,e=this,o=function(t,o){i=t.type+" "+o.id+":"+t.type,e.trigger(i,o);};t.on("destroyed",e.onDestroyed.bind(e)),t.on("shown hidden rested dir plain",o),t.on("dir:up dir:right dir:down dir:left",o),t.on("plain:up plain:right plain:down plain:left",o);},z.prototype.bindDocument=function(){this.binded||(this.bindEvt(document,"move").bindEvt(document,"end"),this.binded=!0);},z.prototype.unbindDocument=function(t){Object.keys(this.ids).length&&!0!==t||(this.unbindEvt(document,"move").unbindEvt(document,"end"),this.binded=!1);},z.prototype.getIdentifier=function(t){var i;return t?void 0===(i=void 0===t.identifier?t.pointerId:t.identifier)&&(i=this.latest||0):i=this.index,void 0===this.ids[i]&&(this.ids[i]=this.index,this.index+=1),this.latest=i,this.ids[i]},z.prototype.removeIdentifier=function(t){var i={};for(var e in this.ids)if(this.ids[e]===t){i.id=e,i.identifier=this.ids[e],delete this.ids[e];break}return i},z.prototype.onmove=function(t){return this.onAny("move",t),!1},z.prototype.onend=function(t){return this.onAny("end",t),!1},z.prototype.oncancel=function(t){return this.onAny("end",t),!1},z.prototype.onAny=function(t,i){var e,o=this,n="processOn"+t.charAt(0).toUpperCase()+t.slice(1);i=l(i);return v(i,function(t){e=o.getIdentifier(t),v(o.collections,function(t,i,e){e.ids.indexOf(i)>=0&&(e[n](t),t._found_=!0);}.bind(null,t,e)),t._found_||o.removeIdentifier(e);}),!1},z.prototype.destroy=function(){this.unbindDocument(!0),this.ids={},this.index=0,this.collections.forEach(function(t){t.destroy();}),this.off();},z.prototype.onDestroyed=function(t,i){if(this.collections.indexOf(i)<0)return !1;this.collections.splice(this.collections.indexOf(i),1);};var D=new z;i.default={create:function(t){return D.create(t)},factory:D};}]).default});
    });

    var nipplejs$1 = /*@__PURE__*/getDefaultExportFromCjs(nipplejs);

    /* src\components\Buttons.svelte generated by Svelte v3.35.0 */

    const { console: console_1 } = globals;
    const file$1 = "src\\components\\Buttons.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i].id;
    	child_ctx[18] = list[i].name;
    	child_ctx[19] = list[i].state;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i].id;
    	child_ctx[18] = list[i].name;
    	child_ctx[19] = list[i].state;
    	return child_ctx;
    }

    // (160:2) {#each inputs as {id, name, state}}
    function create_each_block_1(ctx) {
    	let div;
    	let t0_value = /*id*/ ctx[17] + "";
    	let t0;
    	let t1;
    	let t2_value = /*name*/ ctx[18] + "";
    	let t2;
    	let t3;
    	let t4_value = /*state*/ ctx[19] + "";
    	let t4;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = text(" :: ");
    			t2 = text(t2_value);
    			t3 = text(" :: ");
    			t4 = text(t4_value);
    			attr_dev(div, "class", "" + (null_to_empty(rowClass) + " svelte-4zo826"));
    			add_location(div, file$1, 160, 2, 5448);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    			append_dev(div, t3);
    			append_dev(div, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*inputs*/ 2 && t0_value !== (t0_value = /*id*/ ctx[17] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*inputs*/ 2 && t2_value !== (t2_value = /*name*/ ctx[18] + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*inputs*/ 2 && t4_value !== (t4_value = /*state*/ ctx[19] + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(160:2) {#each inputs as {id, name, state}}",
    		ctx
    	});

    	return block;
    }

    // (167:2) {#each outputs as {id, name, state}}
    function create_each_block(ctx) {
    	let div;
    	let t0_value = /*id*/ ctx[17] + "";
    	let t0;
    	let t1;
    	let t2_value = /*name*/ ctx[18] + "";
    	let t2;
    	let t3;
    	let t4_value = /*state*/ ctx[19] + "";
    	let t4;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = text(" :: ");
    			t2 = text(t2_value);
    			t3 = text(" :: ");
    			t4 = text(t4_value);
    			attr_dev(div, "class", "" + (null_to_empty(rowClass) + " svelte-4zo826"));
    			add_location(div, file$1, 167, 2, 5638);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    			append_dev(div, t3);
    			append_dev(div, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*outputs*/ 4 && t0_value !== (t0_value = /*id*/ ctx[17] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*outputs*/ 4 && t2_value !== (t2_value = /*name*/ ctx[18] + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*outputs*/ 4 && t4_value !== (t4_value = /*state*/ ctx[19] + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(167:2) {#each outputs as {id, name, state}}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div7;
    	let div6;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let i0;
    	let i0_class_value;
    	let t2;
    	let div2;
    	let t3;
    	let i1;
    	let i1_class_value;
    	let t4;
    	let div3;
    	let t5;
    	let t6;
    	let div4;
    	let t7;
    	let t8;
    	let div5;
    	let t9;
    	let t10;
    	let div8;
    	let sliders;
    	let t11;
    	let div9;
    	let test;
    	let t12;
    	let div14;
    	let div11;
    	let div10;
    	let t13;
    	let t14;
    	let t15;
    	let div13;
    	let div12;
    	let t16;
    	let t17;
    	let t18;
    	let div15;
    	let trackcontrols;
    	let t19;
    	let div16;
    	let joystickcontrols;
    	let t20;
    	let div21;
    	let div17;
    	let t21;
    	let div18;
    	let t22;
    	let div19;
    	let t23;
    	let div20;
    	let current;
    	let mounted;
    	let dispose;
    	sliders = new Sliders({ $$inline: true });
    	test = new Test({ $$inline: true });
    	let each_value_1 = /*inputs*/ ctx[1];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*outputs*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	trackcontrols = new TrackControls({ $$inline: true });
    	joystickcontrols = new JoystickControls({ $$inline: true });

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div6 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = text("Enable WebMidi ");
    			i0 = element("i");
    			t2 = space();
    			div2 = element("div");
    			t3 = text("Disable WebMidi ");
    			i1 = element("i");
    			t4 = space();
    			div3 = element("div");
    			t5 = text("Show I/O");
    			t6 = space();
    			div4 = element("div");
    			t7 = text("Send Notes");
    			t8 = space();
    			div5 = element("div");
    			t9 = text("Send CC");
    			t10 = space();
    			div8 = element("div");
    			create_component(sliders.$$.fragment);
    			t11 = space();
    			div9 = element("div");
    			create_component(test.$$.fragment);
    			t12 = space();
    			div14 = element("div");
    			div11 = element("div");
    			div10 = element("div");
    			t13 = text("Inputs");
    			t14 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t15 = space();
    			div13 = element("div");
    			div12 = element("div");
    			t16 = text("Outputs");
    			t17 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t18 = space();
    			div15 = element("div");
    			create_component(trackcontrols.$$.fragment);
    			t19 = space();
    			div16 = element("div");
    			create_component(joystickcontrols.$$.fragment);
    			t20 = space();
    			div21 = element("div");
    			div17 = element("div");
    			t21 = space();
    			div18 = element("div");
    			t22 = space();
    			div19 = element("div");
    			t23 = space();
    			div20 = element("div");
    			add_location(div0, file$1, 137, 2, 4719);

    			attr_dev(i0, "class", i0_class_value = "" + (null_to_empty(/*isEnabled*/ ctx[0]
    			? /*isEnabledStyle*/ ctx[4]
    			: /*isNotEnabledStyle*/ ctx[3]) + " svelte-4zo826"));

    			add_location(i0, file$1, 138, 63, 4795);
    			attr_dev(div1, "class", "" + (null_to_empty(btnStyle) + " svelte-4zo826"));
    			add_location(div1, file$1, 138, 2, 4734);

    			attr_dev(i1, "class", i1_class_value = "" + (null_to_empty(/*isEnabled*/ ctx[0]
    			? /*isEnabledStyle*/ ctx[4]
    			: /*isNotEnabledStyle*/ ctx[3]) + " svelte-4zo826"));

    			add_location(i1, file$1, 139, 65, 4927);
    			attr_dev(div2, "class", "" + (null_to_empty(btnStyle) + " svelte-4zo826"));
    			add_location(div2, file$1, 139, 2, 4864);
    			attr_dev(div3, "class", "" + (null_to_empty(btnStyle) + " svelte-4zo826"));
    			add_location(div3, file$1, 140, 2, 4996);
    			attr_dev(div4, "class", "" + (null_to_empty(btnStyle) + " svelte-4zo826"));
    			add_location(div4, file$1, 141, 2, 5060);
    			attr_dev(div5, "class", "" + (null_to_empty(btnStyle) + " svelte-4zo826"));
    			add_location(div5, file$1, 142, 2, 5129);
    			attr_dev(div6, "class", "flex");
    			add_location(div6, file$1, 136, 1, 4697);
    			add_location(div7, file$1, 135, 0, 4688);
    			attr_dev(div8, "class", "flex");
    			add_location(div8, file$1, 146, 0, 5211);
    			attr_dev(div9, "class", "flex");
    			add_location(div9, file$1, 150, 0, 5255);
    			attr_dev(div10, "class", "" + (null_to_empty(rowTitleClass) + " svelte-4zo826"));
    			add_location(div10, file$1, 158, 2, 5364);
    			add_location(div11, file$1, 157, 1, 5353);
    			attr_dev(div12, "class", "" + (null_to_empty(rowTitleClass) + " svelte-4zo826"));
    			add_location(div12, file$1, 165, 2, 5552);
    			attr_dev(div13, "class", "ml2");
    			add_location(div13, file$1, 164, 1, 5527);
    			attr_dev(div14, "class", "flex mt2");
    			add_location(div14, file$1, 155, 0, 5325);
    			attr_dev(div15, "class", "flex mt2");
    			add_location(div15, file$1, 173, 0, 5726);
    			attr_dev(div16, "class", "flex mt2");
    			add_location(div16, file$1, 177, 0, 5780);
    			attr_dev(div17, "id", "joy01");
    			attr_dev(div17, "class", "zone static active svelte-4zo826");
    			set_style(div17, "touch-action", "none");
    			add_location(div17, file$1, 183, 1, 5878);
    			attr_dev(div18, "id", "joy02");
    			add_location(div18, file$1, 186, 1, 5965);
    			attr_dev(div19, "id", "joy03");
    			add_location(div19, file$1, 187, 1, 5990);
    			attr_dev(div20, "id", "joy04");
    			add_location(div20, file$1, 188, 1, 6015);
    			attr_dev(div21, "id", "zone_joystick");
    			attr_dev(div21, "class", "mt2 svelte-4zo826");
    			add_location(div21, file$1, 181, 0, 5837);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div6);
    			append_dev(div6, div0);
    			append_dev(div6, t0);
    			append_dev(div6, div1);
    			append_dev(div1, t1);
    			append_dev(div1, i0);
    			append_dev(div6, t2);
    			append_dev(div6, div2);
    			append_dev(div2, t3);
    			append_dev(div2, i1);
    			append_dev(div6, t4);
    			append_dev(div6, div3);
    			append_dev(div3, t5);
    			append_dev(div6, t6);
    			append_dev(div6, div4);
    			append_dev(div4, t7);
    			append_dev(div6, t8);
    			append_dev(div6, div5);
    			append_dev(div5, t9);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, div8, anchor);
    			mount_component(sliders, div8, null);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, div9, anchor);
    			mount_component(test, div9, null);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, div14, anchor);
    			append_dev(div14, div11);
    			append_dev(div11, div10);
    			append_dev(div10, t13);
    			append_dev(div11, t14);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div11, null);
    			}

    			append_dev(div14, t15);
    			append_dev(div14, div13);
    			append_dev(div13, div12);
    			append_dev(div12, t16);
    			append_dev(div13, t17);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div13, null);
    			}

    			insert_dev(target, t18, anchor);
    			insert_dev(target, div15, anchor);
    			mount_component(trackcontrols, div15, null);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, div16, anchor);
    			mount_component(joystickcontrols, div16, null);
    			insert_dev(target, t20, anchor);
    			insert_dev(target, div21, anchor);
    			append_dev(div21, div17);
    			append_dev(div21, t21);
    			append_dev(div21, div18);
    			append_dev(div21, t22);
    			append_dev(div21, div19);
    			append_dev(div21, t23);
    			append_dev(div21, div20);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div1, "click", /*handleEnable*/ ctx[5], false, false, false),
    					listen_dev(div2, "click", /*handleDisable*/ ctx[6], false, false, false),
    					listen_dev(div3, "click", /*handleShowIO*/ ctx[7], false, false, false),
    					listen_dev(div4, "click", /*handleSendNotes*/ ctx[8], false, false, false),
    					listen_dev(div5, "click", /*handleSendCc*/ ctx[9], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*isEnabled*/ 1 && i0_class_value !== (i0_class_value = "" + (null_to_empty(/*isEnabled*/ ctx[0]
    			? /*isEnabledStyle*/ ctx[4]
    			: /*isNotEnabledStyle*/ ctx[3]) + " svelte-4zo826"))) {
    				attr_dev(i0, "class", i0_class_value);
    			}

    			if (!current || dirty & /*isEnabled*/ 1 && i1_class_value !== (i1_class_value = "" + (null_to_empty(/*isEnabled*/ ctx[0]
    			? /*isEnabledStyle*/ ctx[4]
    			: /*isNotEnabledStyle*/ ctx[3]) + " svelte-4zo826"))) {
    				attr_dev(i1, "class", i1_class_value);
    			}

    			if (dirty & /*rowClass, inputs*/ 2) {
    				each_value_1 = /*inputs*/ ctx[1];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div11, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*rowClass, outputs*/ 4) {
    				each_value = /*outputs*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div13, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sliders.$$.fragment, local);
    			transition_in(test.$$.fragment, local);
    			transition_in(trackcontrols.$$.fragment, local);
    			transition_in(joystickcontrols.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sliders.$$.fragment, local);
    			transition_out(test.$$.fragment, local);
    			transition_out(trackcontrols.$$.fragment, local);
    			transition_out(joystickcontrols.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(div8);
    			destroy_component(sliders);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(div9);
    			destroy_component(test);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(div14);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t18);
    			if (detaching) detach_dev(div15);
    			destroy_component(trackcontrols);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(div16);
    			destroy_component(joystickcontrols);
    			if (detaching) detach_dev(t20);
    			if (detaching) detach_dev(div21);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const btnStyle = "flex ba b--black-10 pa2 f6 shadow-4 grow fit-w bg-light-red mb1 mr2 pa2 pointer";
    const rowTitleClass = "ba b--black-10 pa2 tc f5 fw4";
    const rowClass = "bl br bb b--black-10 pa2 tl f6";

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Buttons", slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	

    	// Handle mouse scroll
    	const zoom = event => {
    		console.log(event);
    		const x = event.clientX;
    		const y = event.clientY;

    		// What element are we scrolling
    		let focussedEl = document.elementFromPoint(x, y);

    		console.log(focussedEl);
    		let isDataScroll = focussedEl.getAttribute("data-scroll") !== null;
    		let isInput = focussedEl instanceof HTMLInputElement;

    		// Not scrollable input so exit
    		if (!isDataScroll && isInput) {
    			return;
    		}

    		let inputEl = focussedEl;

    		// Change value as per scroll direction
    		let currentValue = parseInt(inputEl.value);

    		var delta = Math.max(-1, Math.min(1, event.deltaY || -event.detail));
    		let newValue = delta < 0 ? currentValue + 1 : currentValue - 1;
    		let inputMax = parseInt(inputEl.max);
    		let inputMin = parseInt(inputEl.min);
    		inputEl.value = Math.min(Math.max(parseInt(newValue.toString()), inputMin), inputMax).toString();
    		console.log("delta", delta);
    		console.log("newValue", inputEl.value);
    	};

    	// Joystick 
    	let joy01;

    	let joy02;
    	let joy03;
    	let joy04;

    	const createJoysticks = () => {
    		joy01 = nipplejs$1.create({
    			zone: document.getElementById("joy01"),
    			mode: "static",
    			position: { left: "10%", top: "50%" },
    			color: "red",
    			size: 200,
    			restJoystick: false
    		});

    		joy02 = nipplejs$1.create({
    			zone: document.getElementById("joy02"),
    			mode: "static",
    			position: { left: "30%", top: "50%" },
    			color: "green",
    			size: 200,
    			restJoystick: false
    		});

    		joy03 = nipplejs$1.create({
    			zone: document.getElementById("joy03"),
    			mode: "static",
    			position: { left: "50%", top: "50%" },
    			color: "red",
    			size: 200,
    			restJoystick: false
    		});

    		joy04 = nipplejs$1.create({
    			zone: document.getElementById("joy04"),
    			mode: "static",
    			position: { left: "70%", top: "50%" },
    			color: "green",
    			size: 200,
    			restJoystick: false
    		});
    	};

    	onMount(() => __awaiter(void 0, void 0, void 0, function* () {
    		// Capture mouse wheel
    		document.onwheel = zoom;

    		// Enable web midi
    		enableWebMidi();

    		$$invalidate(0, isEnabled = true);
    		createJoysticks();
    	}));

    	let isEnabled = false;
    	let isNotEnabledStyle = "fa fa-times ml2 black";
    	let isEnabledStyle = "fa fa-check ml2 black";
    	let inputs = [];
    	let outputs = [];

    	function handleEnable() {
    		const isSupported = isWebMidi();

    		isSupported
    		? console.log("WebMidi supported")
    		: alert("WebMidi not supported");

    		if (isSupported) {
    			enableWebMidi();
    			$$invalidate(0, isEnabled = true);
    		} else {
    			return;
    		}
    	}

    	const handleDisable = () => __awaiter(void 0, void 0, void 0, function* () {
    		yield disableWebMidi();
    		$$invalidate(0, isEnabled = false);
    	});

    	const handleShowIO = () => {
    		$$invalidate(1, inputs = getInputs());
    		$$invalidate(2, outputs = getOutputs());
    	};

    	const handleSendNotes = () => {
    		const note = [42, 44, 46, 48, 50];
    		const port = 6;
    		playNote(port, note);
    	};

    	const handleSendCc = () => {
    		const value = 127;
    		const port = 6;
    		const controller = 14;
    		sendCc(port, controller, value);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Buttons> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		__awaiter,
    		onMount,
    		isWebMidi,
    		enableWebMidi,
    		getInputs,
    		getOutputs,
    		playNote,
    		sendCc,
    		disableWebMidi,
    		JoystickControls,
    		TrackControls,
    		Sliders,
    		Test,
    		nipplejs: nipplejs$1,
    		Joystick: nipplejs.Joystick,
    		JoystickManagerOptions: nipplejs.JoystickManagerOptions,
    		prevent_default,
    		set_attributes,
    		zoom,
    		joy01,
    		joy02,
    		joy03,
    		joy04,
    		createJoysticks,
    		btnStyle,
    		isEnabled,
    		isNotEnabledStyle,
    		isEnabledStyle,
    		inputs,
    		outputs,
    		handleEnable,
    		handleDisable,
    		handleShowIO,
    		handleSendNotes,
    		handleSendCc,
    		rowTitleClass,
    		rowClass
    	});

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    		if ("joy01" in $$props) joy01 = $$props.joy01;
    		if ("joy02" in $$props) joy02 = $$props.joy02;
    		if ("joy03" in $$props) joy03 = $$props.joy03;
    		if ("joy04" in $$props) joy04 = $$props.joy04;
    		if ("isEnabled" in $$props) $$invalidate(0, isEnabled = $$props.isEnabled);
    		if ("isNotEnabledStyle" in $$props) $$invalidate(3, isNotEnabledStyle = $$props.isNotEnabledStyle);
    		if ("isEnabledStyle" in $$props) $$invalidate(4, isEnabledStyle = $$props.isEnabledStyle);
    		if ("inputs" in $$props) $$invalidate(1, inputs = $$props.inputs);
    		if ("outputs" in $$props) $$invalidate(2, outputs = $$props.outputs);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		isEnabled,
    		inputs,
    		outputs,
    		isNotEnabledStyle,
    		isEnabledStyle,
    		handleEnable,
    		handleDisable,
    		handleShowIO,
    		handleSendNotes,
    		handleSendCc
    	];
    }

    class Buttons extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Buttons",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.35.0 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let buttons;
    	let current;
    	buttons = new Buttons({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(buttons.$$.fragment);
    			attr_dev(main, "class", "svelte-1h6otfa");
    			add_location(main, file, 3, 0, 81);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(buttons, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(buttons.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(buttons.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(buttons);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Buttons });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: 'world and midi-pad'
        }
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
