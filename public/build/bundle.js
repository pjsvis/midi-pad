
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
    			div.textContent = "Hello JoystickControls";
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

    /* src\components\Knob.svelte generated by Svelte v3.35.0 */

    const { console: console_1$2 } = globals;
    const file$5 = "src\\components\\Knob.svelte";

    function create_fragment$5(ctx) {
    	let div1;
    	let input;
    	let t0;
    	let div0;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			input = element("input");
    			t0 = space();
    			div0 = element("div");
    			div0.textContent = "63";
    			attr_dev(input, "class", "pointer");
    			attr_dev(input, "type", "range");
    			attr_dev(input, "min", "0");
    			attr_dev(input, "max", "127");
    			attr_dev(input, "data-scroll", "");
    			input.value = "63";
    			add_location(input, file$5, 22, 4, 1094);
    			attr_dev(div0, "class", "rotateText f7 svelte-qq06e4");
    			add_location(div0, file$5, 24, 4, 1205);
    			attr_dev(div1, "class", "vertical grow ba b--black-10 pa2 grow fit-w  mb2 svelte-qq06e4");
    			add_location(div1, file$5, 20, 0, 1021);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, input);
    			append_dev(div1, t0);
    			append_dev(div1, div0);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*showCaption*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Knob", slots, []);

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

    	// TODO: Add props for max min value title
    	// TODO: Use flex for layout
    	onMount(() => __awaiter(void 0, void 0, void 0, function* () {
    		console.log("knob mounted");
    	}));

    	const showCaption = event => {
    		console.log("showwCaption", event);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<Knob> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ __awaiter, onMount, showCaption });

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [showCaption];
    }

    class Knob extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Knob",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\components\Todo.svelte generated by Svelte v3.35.0 */

    const file$4 = "src\\components\\Todo.svelte";

    function create_fragment$4(ctx) {
    	let div5;
    	let div0;
    	let t0;
    	let t1;
    	let div1;
    	let t2;
    	let t3;
    	let div2;
    	let t4;
    	let t5;
    	let div3;
    	let t6;
    	let t7;
    	let div4;
    	let t8;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div0 = element("div");
    			t0 = text("ToDo");
    			t1 = space();
    			div1 = element("div");
    			t2 = text("Add button to switch off WebMIDI");
    			t3 = space();
    			div2 = element("div");
    			t4 = text("Wire up joystick listeners");
    			t5 = space();
    			div3 = element("div");
    			t6 = text("Capture mouse wheel and prevent scrolling when over slider");
    			t7 = space();
    			div4 = element("div");
    			t8 = text("Make track buttons toggle tracks");
    			attr_dev(div0, "class", rowTitleClass$1);
    			add_location(div0, file$4, 4, 4, 155);
    			attr_dev(div1, "class", rowClass$1);
    			add_location(div1, file$4, 5, 4, 198);
    			attr_dev(div2, "class", rowClass$1);
    			add_location(div2, file$4, 6, 4, 264);
    			attr_dev(div3, "class", rowClass$1);
    			add_location(div3, file$4, 7, 4, 324);
    			attr_dev(div4, "class", rowClass$1);
    			add_location(div4, file$4, 8, 4, 416);
    			add_location(div5, file$4, 3, 0, 144);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div0, t0);
    			append_dev(div5, t1);
    			append_dev(div5, div1);
    			append_dev(div1, t2);
    			append_dev(div5, t3);
    			append_dev(div5, div2);
    			append_dev(div2, t4);
    			append_dev(div5, t5);
    			append_dev(div5, div3);
    			append_dev(div3, t6);
    			append_dev(div5, t7);
    			append_dev(div5, div4);
    			append_dev(div4, t8);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
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

    const rowTitleClass$1 = "ba b--black-10 pa2 tc f5 fw4";
    const rowClass$1 = "bl br bb b--black-10 pa2 tl f6";

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Todo", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Todo> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ rowTitleClass: rowTitleClass$1, rowClass: rowClass$1 });
    	return [];
    }

    class Todo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Todo",
    			options,
    			id: create_fragment$4.name
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

    const file$3 = "node_modules\\svelte-range-slider-pips\\src\\RangePips.svelte";

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
    			add_location(span, file$3, 137, 4, 3365);
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
    			add_location(span, file$3, 143, 8, 3575);
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
    			add_location(span, file$3, 152, 8, 3829);
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
    			add_location(span, file$3, 158, 12, 4089);
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
    			add_location(span, file$3, 167, 4, 4294);
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
    			add_location(span, file$3, 173, 8, 4504);
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

    function create_fragment$3(ctx) {
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
    			add_location(div, file$3, 135, 0, 3265);
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
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
    			id: create_fragment$3.name
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
    const file$2 = "node_modules\\svelte-range-slider-pips\\src\\RangeSlider.svelte";

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
    			add_location(span, file$2, 766, 8, 22002);
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
    			add_location(span0, file$2, 764, 6, 21950);
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
    			add_location(span1, file$2, 745, 4, 21134);
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
    			add_location(span, file$2, 771, 4, 22127);
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

    function create_fragment$2(ctx) {
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
    			add_location(div, file$2, 727, 0, 20635);
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
    		id: create_fragment$2.name,
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

    function instance$2($$self, $$props, $$invalidate) {
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
    			instance$2,
    			create_fragment$2,
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
    			id: create_fragment$2.name
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

    var nipplejs = createCommonjsModule(function (module, exports) {
    !function(t,i){module.exports=i();}(window,function(){return function(t){var i={};function e(o){if(i[o])return i[o].exports;var n=i[o]={i:o,l:!1,exports:{}};return t[o].call(n.exports,n,n.exports,e),n.l=!0,n.exports}return e.m=t,e.c=i,e.d=function(t,i,o){e.o(t,i)||Object.defineProperty(t,i,{enumerable:!0,get:o});},e.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0});},e.t=function(t,i){if(1&i&&(t=e(t)),8&i)return t;if(4&i&&"object"==typeof t&&t&&t.__esModule)return t;var o=Object.create(null);if(e.r(o),Object.defineProperty(o,"default",{enumerable:!0,value:t}),2&i&&"string"!=typeof t)for(var n in t)e.d(o,n,function(i){return t[i]}.bind(null,n));return o},e.n=function(t){var i=t&&t.__esModule?function(){return t.default}:function(){return t};return e.d(i,"a",i),i},e.o=function(t,i){return Object.prototype.hasOwnProperty.call(t,i)},e.p="",e(e.s=0)}([function(t,i,e){e.r(i);var o,n=function(t,i){var e=i.x-t.x,o=i.y-t.y;return Math.sqrt(e*e+o*o)},s=function(t){return t*(Math.PI/180)},r=function(t){return t*(180/Math.PI)},d=new Map,a=function(t){d.has(t)&&clearTimeout(d.get(t)),d.set(t,setTimeout(t,100));},p=function(t,i,e){for(var o,n=i.split(/[ ,]+/g),s=0;s<n.length;s+=1)o=n[s],t.addEventListener?t.addEventListener(o,e,!1):t.attachEvent&&t.attachEvent(o,e);},c=function(t,i,e){for(var o,n=i.split(/[ ,]+/g),s=0;s<n.length;s+=1)o=n[s],t.removeEventListener?t.removeEventListener(o,e):t.detachEvent&&t.detachEvent(o,e);},l=function(t){return t.preventDefault(),t.type.match(/^touch/)?t.changedTouches:t},h=function(){return {x:void 0!==window.pageXOffset?window.pageXOffset:(document.documentElement||document.body.parentNode||document.body).scrollLeft,y:void 0!==window.pageYOffset?window.pageYOffset:(document.documentElement||document.body.parentNode||document.body).scrollTop}},u=function(t,i){i.top||i.right||i.bottom||i.left?(t.style.top=i.top,t.style.right=i.right,t.style.bottom=i.bottom,t.style.left=i.left):(t.style.left=i.x+"px",t.style.top=i.y+"px");},f=function(t,i,e){var o=y(t);for(var n in o)if(o.hasOwnProperty(n))if("string"==typeof i)o[n]=i+" "+e;else {for(var s="",r=0,d=i.length;r<d;r+=1)s+=i[r]+" "+e+", ";o[n]=s.slice(0,-2);}return o},y=function(t){var i={};i[t]="";return ["webkit","Moz","o"].forEach(function(e){i[e+t.charAt(0).toUpperCase()+t.slice(1)]="";}),i},m=function(t,i){for(var e in i)i.hasOwnProperty(e)&&(t[e]=i[e]);return t},v=function(t,i){if(t.length)for(var e=0,o=t.length;e<o;e+=1)i(t[e]);else i(t);},g=!!("ontouchstart"in window),b=!!window.PointerEvent,x=!!window.MSPointerEvent,O={start:"mousedown",move:"mousemove",end:"mouseup"},w={};function _(){}b?o={start:"pointerdown",move:"pointermove",end:"pointerup, pointercancel"}:x?o={start:"MSPointerDown",move:"MSPointerMove",end:"MSPointerUp"}:g?(o={start:"touchstart",move:"touchmove",end:"touchend, touchcancel"},w=O):o=O,_.prototype.on=function(t,i){var e,o=t.split(/[ ,]+/g);this._handlers_=this._handlers_||{};for(var n=0;n<o.length;n+=1)e=o[n],this._handlers_[e]=this._handlers_[e]||[],this._handlers_[e].push(i);return this},_.prototype.off=function(t,i){return this._handlers_=this._handlers_||{},void 0===t?this._handlers_={}:void 0===i?this._handlers_[t]=null:this._handlers_[t]&&this._handlers_[t].indexOf(i)>=0&&this._handlers_[t].splice(this._handlers_[t].indexOf(i),1),this},_.prototype.trigger=function(t,i){var e,o=this,n=t.split(/[ ,]+/g);o._handlers_=o._handlers_||{};for(var s=0;s<n.length;s+=1)e=n[s],o._handlers_[e]&&o._handlers_[e].length&&o._handlers_[e].forEach(function(t){t.call(o,{type:e,target:o},i);});},_.prototype.config=function(t){this.options=this.defaults||{},t&&(this.options=function(t,i){var e={};for(var o in t)t.hasOwnProperty(o)&&i.hasOwnProperty(o)?e[o]=i[o]:t.hasOwnProperty(o)&&(e[o]=t[o]);return e}(this.options,t));},_.prototype.bindEvt=function(t,i){var e=this;return e._domHandlers_=e._domHandlers_||{},e._domHandlers_[i]=function(){"function"==typeof e["on"+i]?e["on"+i].apply(e,arguments):console.warn('[WARNING] : Missing "on'+i+'" handler.');},p(t,o[i],e._domHandlers_[i]),w[i]&&p(t,w[i],e._domHandlers_[i]),e},_.prototype.unbindEvt=function(t,i){return this._domHandlers_=this._domHandlers_||{},c(t,o[i],this._domHandlers_[i]),w[i]&&c(t,w[i],this._domHandlers_[i]),delete this._domHandlers_[i],this};var T=_;function k(t,i){return this.identifier=i.identifier,this.position=i.position,this.frontPosition=i.frontPosition,this.collection=t,this.defaults={size:100,threshold:.1,color:"white",fadeTime:250,dataOnly:!1,restJoystick:!0,restOpacity:.5,mode:"dynamic",zone:document.body,lockX:!1,lockY:!1,shape:"circle"},this.config(i),"dynamic"===this.options.mode&&(this.options.restOpacity=0),this.id=k.id,k.id+=1,this.buildEl().stylize(),this.instance={el:this.ui.el,on:this.on.bind(this),off:this.off.bind(this),show:this.show.bind(this),hide:this.hide.bind(this),add:this.addToDom.bind(this),remove:this.removeFromDom.bind(this),destroy:this.destroy.bind(this),setPosition:this.setPosition.bind(this),resetDirection:this.resetDirection.bind(this),computeDirection:this.computeDirection.bind(this),trigger:this.trigger.bind(this),position:this.position,frontPosition:this.frontPosition,ui:this.ui,identifier:this.identifier,id:this.id,options:this.options},this.instance}k.prototype=new T,k.constructor=k,k.id=0,k.prototype.buildEl=function(t){return this.ui={},this.options.dataOnly?this:(this.ui.el=document.createElement("div"),this.ui.back=document.createElement("div"),this.ui.front=document.createElement("div"),this.ui.el.className="nipple collection_"+this.collection.id,this.ui.back.className="back",this.ui.front.className="front",this.ui.el.setAttribute("id","nipple_"+this.collection.id+"_"+this.id),this.ui.el.appendChild(this.ui.back),this.ui.el.appendChild(this.ui.front),this)},k.prototype.stylize=function(){if(this.options.dataOnly)return this;var t=this.options.fadeTime+"ms",i=function(t,i){var e=y(t);for(var o in e)e.hasOwnProperty(o)&&(e[o]=i);return e}("borderRadius","50%"),e=f("transition","opacity",t),o={};return o.el={position:"absolute",opacity:this.options.restOpacity,display:"block",zIndex:999},o.back={position:"absolute",display:"block",width:this.options.size+"px",height:this.options.size+"px",marginLeft:-this.options.size/2+"px",marginTop:-this.options.size/2+"px",background:this.options.color,opacity:".5"},o.front={width:this.options.size/2+"px",height:this.options.size/2+"px",position:"absolute",display:"block",marginLeft:-this.options.size/4+"px",marginTop:-this.options.size/4+"px",background:this.options.color,opacity:".5"},m(o.el,e),"circle"===this.options.shape&&m(o.back,i),m(o.front,i),this.applyStyles(o),this},k.prototype.applyStyles=function(t){for(var i in this.ui)if(this.ui.hasOwnProperty(i))for(var e in t[i])this.ui[i].style[e]=t[i][e];return this},k.prototype.addToDom=function(){return this.options.dataOnly||document.body.contains(this.ui.el)?this:(this.options.zone.appendChild(this.ui.el),this)},k.prototype.removeFromDom=function(){return this.options.dataOnly||!document.body.contains(this.ui.el)?this:(this.options.zone.removeChild(this.ui.el),this)},k.prototype.destroy=function(){clearTimeout(this.removeTimeout),clearTimeout(this.showTimeout),clearTimeout(this.restTimeout),this.trigger("destroyed",this.instance),this.removeFromDom(),this.off();},k.prototype.show=function(t){var i=this;return i.options.dataOnly?i:(clearTimeout(i.removeTimeout),clearTimeout(i.showTimeout),clearTimeout(i.restTimeout),i.addToDom(),i.restCallback(),setTimeout(function(){i.ui.el.style.opacity=1;},0),i.showTimeout=setTimeout(function(){i.trigger("shown",i.instance),"function"==typeof t&&t.call(this);},i.options.fadeTime),i)},k.prototype.hide=function(t){var i=this;return i.options.dataOnly?i:(i.ui.el.style.opacity=i.options.restOpacity,clearTimeout(i.removeTimeout),clearTimeout(i.showTimeout),clearTimeout(i.restTimeout),i.removeTimeout=setTimeout(function(){var e="dynamic"===i.options.mode?"none":"block";i.ui.el.style.display=e,"function"==typeof t&&t.call(i),i.trigger("hidden",i.instance);},i.options.fadeTime),i.options.restJoystick&&i.setPosition(t,{x:0,y:0}),i)},k.prototype.setPosition=function(t,i){var e=this;e.frontPosition={x:i.x,y:i.y};var o=e.options.fadeTime+"ms",n={};n.front=f("transition",["top","left"],o);var s={front:{}};s.front={left:e.frontPosition.x+"px",top:e.frontPosition.y+"px"},e.applyStyles(n),e.applyStyles(s),e.restTimeout=setTimeout(function(){"function"==typeof t&&t.call(e),e.restCallback();},e.options.fadeTime);},k.prototype.restCallback=function(){var t={};t.front=f("transition","none",""),this.applyStyles(t),this.trigger("rested",this.instance);},k.prototype.resetDirection=function(){this.direction={x:!1,y:!1,angle:!1};},k.prototype.computeDirection=function(t){var i,e,o,n=t.angle.radian,s=Math.PI/4,r=Math.PI/2;if(n>s&&n<3*s&&!t.lockX?i="up":n>-s&&n<=s&&!t.lockY?i="left":n>3*-s&&n<=-s&&!t.lockX?i="down":t.lockY||(i="right"),t.lockY||(e=n>-r&&n<r?"left":"right"),t.lockX||(o=n>0?"up":"down"),t.force>this.options.threshold){var d,a={};for(d in this.direction)this.direction.hasOwnProperty(d)&&(a[d]=this.direction[d]);var p={};for(d in this.direction={x:e,y:o,angle:i},t.direction=this.direction,a)a[d]===this.direction[d]&&(p[d]=!0);if(p.x&&p.y&&p.angle)return t;p.x&&p.y||this.trigger("plain",t),p.x||this.trigger("plain:"+e,t),p.y||this.trigger("plain:"+o,t),p.angle||this.trigger("dir dir:"+i,t);}else this.resetDirection();return t};var P=k;function E(t,i){return this.nipples=[],this.idles=[],this.actives=[],this.ids=[],this.pressureIntervals={},this.manager=t,this.id=E.id,E.id+=1,this.defaults={zone:document.body,multitouch:!1,maxNumberOfNipples:10,mode:"dynamic",position:{top:0,left:0},catchDistance:200,size:100,threshold:.1,color:"white",fadeTime:250,dataOnly:!1,restJoystick:!0,restOpacity:.5,lockX:!1,lockY:!1,shape:"circle",dynamicPage:!1,follow:!1},this.config(i),"static"!==this.options.mode&&"semi"!==this.options.mode||(this.options.multitouch=!1),this.options.multitouch||(this.options.maxNumberOfNipples=1),this.updateBox(),this.prepareNipples(),this.bindings(),this.begin(),this.nipples}E.prototype=new T,E.constructor=E,E.id=0,E.prototype.prepareNipples=function(){var t=this.nipples;t.on=this.on.bind(this),t.off=this.off.bind(this),t.options=this.options,t.destroy=this.destroy.bind(this),t.ids=this.ids,t.id=this.id,t.processOnMove=this.processOnMove.bind(this),t.processOnEnd=this.processOnEnd.bind(this),t.get=function(i){if(void 0===i)return t[0];for(var e=0,o=t.length;e<o;e+=1)if(t[e].identifier===i)return t[e];return !1};},E.prototype.bindings=function(){this.bindEvt(this.options.zone,"start"),this.options.zone.style.touchAction="none",this.options.zone.style.msTouchAction="none";},E.prototype.begin=function(){var t=this.options;if("static"===t.mode){var i=this.createNipple(t.position,this.manager.getIdentifier());i.add(),this.idles.push(i);}},E.prototype.createNipple=function(t,i){var e=this.manager.scroll,o={},n=this.options;if(t.x&&t.y)o={x:t.x-(e.x+this.box.left),y:t.y-(e.y+this.box.top)};else if(t.top||t.right||t.bottom||t.left){var s=document.createElement("DIV");s.style.display="hidden",s.style.top=t.top,s.style.right=t.right,s.style.bottom=t.bottom,s.style.left=t.left,s.style.position="absolute",n.zone.appendChild(s);var r=s.getBoundingClientRect();n.zone.removeChild(s),o=t,t={x:r.left+e.x,y:r.top+e.y};}var d=new P(this,{color:n.color,size:n.size,threshold:n.threshold,fadeTime:n.fadeTime,dataOnly:n.dataOnly,restJoystick:n.restJoystick,restOpacity:n.restOpacity,mode:n.mode,identifier:i,position:t,zone:n.zone,frontPosition:{x:0,y:0},shape:n.shape});return n.dataOnly||(u(d.ui.el,o),u(d.ui.front,d.frontPosition)),this.nipples.push(d),this.trigger("added "+d.identifier+":added",d),this.manager.trigger("added "+d.identifier+":added",d),this.bindNipple(d),d},E.prototype.updateBox=function(){this.box=this.options.zone.getBoundingClientRect();},E.prototype.bindNipple=function(t){var i,e=this,o=function(t,o){i=t.type+" "+o.id+":"+t.type,e.trigger(i,o);};t.on("destroyed",e.onDestroyed.bind(e)),t.on("shown hidden rested dir plain",o),t.on("dir:up dir:right dir:down dir:left",o),t.on("plain:up plain:right plain:down plain:left",o);},E.prototype.pressureFn=function(t,i,e){var o=this,n=0;clearInterval(o.pressureIntervals[e]),o.pressureIntervals[e]=setInterval(function(){var e=t.force||t.pressure||t.webkitForce||0;e!==n&&(i.trigger("pressure",e),o.trigger("pressure "+i.identifier+":pressure",e),n=e);}.bind(o),100);},E.prototype.onstart=function(t){var i=this,e=i.options,o=t;t=l(t),i.updateBox();return v(t,function(n){i.actives.length<e.maxNumberOfNipples?i.processOnStart(n):o.type.match(/^touch/)&&(Object.keys(i.manager.ids).forEach(function(e){if(Object.values(o.touches).findIndex(function(t){return t.identifier===e})<0){var n=[t[0]];n.identifier=e,i.processOnEnd(n);}}),i.actives.length<e.maxNumberOfNipples&&i.processOnStart(n));}),i.manager.bindDocument(),!1},E.prototype.processOnStart=function(t){var i,e=this,o=e.options,s=e.manager.getIdentifier(t),r=t.force||t.pressure||t.webkitForce||0,d={x:t.pageX,y:t.pageY},a=e.getOrCreate(s,d);a.identifier!==s&&e.manager.removeIdentifier(a.identifier),a.identifier=s;var p=function(i){i.trigger("start",i),e.trigger("start "+i.id+":start",i),i.show(),r>0&&e.pressureFn(t,i,i.identifier),e.processOnMove(t);};if((i=e.idles.indexOf(a))>=0&&e.idles.splice(i,1),e.actives.push(a),e.ids.push(a.identifier),"semi"!==o.mode)p(a);else {if(!(n(d,a.position)<=o.catchDistance))return a.destroy(),void e.processOnStart(t);p(a);}return a},E.prototype.getOrCreate=function(t,i){var e,o=this.options;return /(semi|static)/.test(o.mode)?(e=this.idles[0])?(this.idles.splice(0,1),e):"semi"===o.mode?this.createNipple(i,t):(console.warn("Coudln't find the needed nipple."),!1):e=this.createNipple(i,t)},E.prototype.processOnMove=function(t){var i=this.options,e=this.manager.getIdentifier(t),o=this.nipples.get(e),d=this.manager.scroll;if(function(t){return isNaN(t.buttons)?0!==t.pressure:0!==t.buttons}(t)){if(!o)return console.error("Found zombie joystick with ID "+e),void this.manager.removeIdentifier(e);if(i.dynamicPage){var a=o.el.getBoundingClientRect();o.position={x:d.x+a.left,y:d.y+a.top};}o.identifier=e;var p=o.options.size/2,c={x:t.pageX,y:t.pageY};i.lockX&&(c.y=o.position.y),i.lockY&&(c.x=o.position.x);var l,h,f,y,m,v,g,b,x,O,w=n(c,o.position),_=(l=c,h=o.position,f=h.x-l.x,y=h.y-l.y,r(Math.atan2(y,f))),T=s(_),k=w/p,P={distance:w,position:c};if("circle"===o.options.shape?(m=Math.min(w,p),g=o.position,b=m,O={x:0,y:0},x=s(x=_),O.x=g.x-b*Math.cos(x),O.y=g.y-b*Math.sin(x),v=O):(v=function(t,i,e){return {x:Math.min(Math.max(t.x,i.x-e),i.x+e),y:Math.min(Math.max(t.y,i.y-e),i.y+e)}}(c,o.position,p),m=n(v,o.position)),i.follow){if(w>p){var E=c.x-v.x,I=c.y-v.y;o.position.x+=E,o.position.y+=I,o.el.style.top=o.position.y-(this.box.top+d.y)+"px",o.el.style.left=o.position.x-(this.box.left+d.x)+"px",w=n(c,o.position);}}else c=v,w=m;var z=c.x-o.position.x,D=c.y-o.position.y;o.frontPosition={x:z,y:D},i.dataOnly||u(o.ui.front,o.frontPosition);var M={identifier:o.identifier,position:c,force:k,pressure:t.force||t.pressure||t.webkitForce||0,distance:w,angle:{radian:T,degree:_},vector:{x:z/p,y:-D/p},raw:P,instance:o,lockX:i.lockX,lockY:i.lockY};(M=o.computeDirection(M)).angle={radian:s(180-_),degree:180-_},o.trigger("move",M),this.trigger("move "+o.id+":move",M);}else this.processOnEnd(t);},E.prototype.processOnEnd=function(t){var i=this,e=i.options,o=i.manager.getIdentifier(t),n=i.nipples.get(o),s=i.manager.removeIdentifier(n.identifier);n&&(e.dataOnly||n.hide(function(){"dynamic"===e.mode&&(n.trigger("removed",n),i.trigger("removed "+n.id+":removed",n),i.manager.trigger("removed "+n.id+":removed",n),n.destroy());}),clearInterval(i.pressureIntervals[n.identifier]),n.resetDirection(),n.trigger("end",n),i.trigger("end "+n.id+":end",n),i.ids.indexOf(n.identifier)>=0&&i.ids.splice(i.ids.indexOf(n.identifier),1),i.actives.indexOf(n)>=0&&i.actives.splice(i.actives.indexOf(n),1),/(semi|static)/.test(e.mode)?i.idles.push(n):i.nipples.indexOf(n)>=0&&i.nipples.splice(i.nipples.indexOf(n),1),i.manager.unbindDocument(),/(semi|static)/.test(e.mode)&&(i.manager.ids[s.id]=s.identifier));},E.prototype.onDestroyed=function(t,i){this.nipples.indexOf(i)>=0&&this.nipples.splice(this.nipples.indexOf(i),1),this.actives.indexOf(i)>=0&&this.actives.splice(this.actives.indexOf(i),1),this.idles.indexOf(i)>=0&&this.idles.splice(this.idles.indexOf(i),1),this.ids.indexOf(i.identifier)>=0&&this.ids.splice(this.ids.indexOf(i.identifier),1),this.manager.removeIdentifier(i.identifier),this.manager.unbindDocument();},E.prototype.destroy=function(){for(var t in this.unbindEvt(this.options.zone,"start"),this.nipples.forEach(function(t){t.destroy();}),this.pressureIntervals)this.pressureIntervals.hasOwnProperty(t)&&clearInterval(this.pressureIntervals[t]);this.trigger("destroyed",this.nipples),this.manager.unbindDocument(),this.off();};var I=E;function z(t){var i=this;i.ids={},i.index=0,i.collections=[],i.scroll=h(),i.config(t),i.prepareCollections();var e=function(){var t;i.collections.forEach(function(e){e.forEach(function(e){t=e.el.getBoundingClientRect(),e.position={x:i.scroll.x+t.left,y:i.scroll.y+t.top};});});};p(window,"resize",function(){a(e);});var o=function(){i.scroll=h();};return p(window,"scroll",function(){a(o);}),i.collections}z.prototype=new T,z.constructor=z,z.prototype.prepareCollections=function(){var t=this;t.collections.create=t.create.bind(t),t.collections.on=t.on.bind(t),t.collections.off=t.off.bind(t),t.collections.destroy=t.destroy.bind(t),t.collections.get=function(i){var e;return t.collections.every(function(t){return !(e=t.get(i))}),e};},z.prototype.create=function(t){return this.createCollection(t)},z.prototype.createCollection=function(t){var i=new I(this,t);return this.bindCollection(i),this.collections.push(i),i},z.prototype.bindCollection=function(t){var i,e=this,o=function(t,o){i=t.type+" "+o.id+":"+t.type,e.trigger(i,o);};t.on("destroyed",e.onDestroyed.bind(e)),t.on("shown hidden rested dir plain",o),t.on("dir:up dir:right dir:down dir:left",o),t.on("plain:up plain:right plain:down plain:left",o);},z.prototype.bindDocument=function(){this.binded||(this.bindEvt(document,"move").bindEvt(document,"end"),this.binded=!0);},z.prototype.unbindDocument=function(t){Object.keys(this.ids).length&&!0!==t||(this.unbindEvt(document,"move").unbindEvt(document,"end"),this.binded=!1);},z.prototype.getIdentifier=function(t){var i;return t?void 0===(i=void 0===t.identifier?t.pointerId:t.identifier)&&(i=this.latest||0):i=this.index,void 0===this.ids[i]&&(this.ids[i]=this.index,this.index+=1),this.latest=i,this.ids[i]},z.prototype.removeIdentifier=function(t){var i={};for(var e in this.ids)if(this.ids[e]===t){i.id=e,i.identifier=this.ids[e],delete this.ids[e];break}return i},z.prototype.onmove=function(t){return this.onAny("move",t),!1},z.prototype.onend=function(t){return this.onAny("end",t),!1},z.prototype.oncancel=function(t){return this.onAny("end",t),!1},z.prototype.onAny=function(t,i){var e,o=this,n="processOn"+t.charAt(0).toUpperCase()+t.slice(1);i=l(i);return v(i,function(t){e=o.getIdentifier(t),v(o.collections,function(t,i,e){e.ids.indexOf(i)>=0&&(e[n](t),t._found_=!0);}.bind(null,t,e)),t._found_||o.removeIdentifier(e);}),!1},z.prototype.destroy=function(){this.unbindDocument(!0),this.ids={},this.index=0,this.collections.forEach(function(t){t.destroy();}),this.off();},z.prototype.onDestroyed=function(t,i){if(this.collections.indexOf(i)<0)return !1;this.collections.splice(this.collections.indexOf(i),1);};var D=new z;i.default={create:function(t){return D.create(t)},factory:D};}]).default});
    });

    var nipplejs$1 = /*@__PURE__*/getDefaultExportFromCjs(nipplejs);

    var keyboard = createCommonjsModule(function (module, exports) {
    (function (global, factory) {
      module.exports = factory() ;
    }(commonjsGlobal, (function () {
      function _typeof(obj) {
        "@babel/helpers - typeof";

        if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
          _typeof = function (obj) {
            return typeof obj;
          };
        } else {
          _typeof = function (obj) {
            return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
          };
        }

        return _typeof(obj);
      }

      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }

      function _defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
          var descriptor = props[i];
          descriptor.enumerable = descriptor.enumerable || false;
          descriptor.configurable = true;
          if ("value" in descriptor) descriptor.writable = true;
          Object.defineProperty(target, descriptor.key, descriptor);
        }
      }

      function _createClass(Constructor, protoProps, staticProps) {
        if (protoProps) _defineProperties(Constructor.prototype, protoProps);
        if (staticProps) _defineProperties(Constructor, staticProps);
        return Constructor;
      }

      function _toConsumableArray(arr) {
        return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
      }

      function _arrayWithoutHoles(arr) {
        if (Array.isArray(arr)) return _arrayLikeToArray(arr);
      }

      function _iterableToArray(iter) {
        if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
      }

      function _unsupportedIterableToArray(o, minLen) {
        if (!o) return;
        if (typeof o === "string") return _arrayLikeToArray(o, minLen);
        var n = Object.prototype.toString.call(o).slice(8, -1);
        if (n === "Object" && o.constructor) n = o.constructor.name;
        if (n === "Map" || n === "Set") return Array.from(o);
        if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
      }

      function _arrayLikeToArray(arr, len) {
        if (len == null || len > arr.length) len = arr.length;

        for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

        return arr2;
      }

      function _nonIterableSpread() {
        throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
      }

      var KeyCombo = /*#__PURE__*/function () {
        function KeyCombo(keyComboStr) {
          _classCallCheck(this, KeyCombo);

          this.sourceStr = keyComboStr;
          this.subCombos = KeyCombo.parseComboStr(keyComboStr);
          this.keyNames = this.subCombos.reduce(function (memo, nextSubCombo) {
            return memo.concat(nextSubCombo);
          }, []);
        }

        _createClass(KeyCombo, [{
          key: "check",
          value: function check(pressedKeyNames) {
            var startingKeyNameIndex = 0;

            for (var i = 0; i < this.subCombos.length; i += 1) {
              startingKeyNameIndex = this._checkSubCombo(this.subCombos[i], startingKeyNameIndex, pressedKeyNames);

              if (startingKeyNameIndex === -1) {
                return false;
              }
            }

            return true;
          }
        }, {
          key: "isEqual",
          value: function isEqual(otherKeyCombo) {
            if (!otherKeyCombo || typeof otherKeyCombo !== 'string' && _typeof(otherKeyCombo) !== 'object') {
              return false;
            }

            if (typeof otherKeyCombo === 'string') {
              otherKeyCombo = new KeyCombo(otherKeyCombo);
            }

            if (this.subCombos.length !== otherKeyCombo.subCombos.length) {
              return false;
            }

            for (var i = 0; i < this.subCombos.length; i += 1) {
              if (this.subCombos[i].length !== otherKeyCombo.subCombos[i].length) {
                return false;
              }
            }

            for (var _i = 0; _i < this.subCombos.length; _i += 1) {
              var subCombo = this.subCombos[_i];

              var otherSubCombo = otherKeyCombo.subCombos[_i].slice(0);

              for (var j = 0; j < subCombo.length; j += 1) {
                var keyName = subCombo[j];
                var index = otherSubCombo.indexOf(keyName);

                if (index > -1) {
                  otherSubCombo.splice(index, 1);
                }
              }

              if (otherSubCombo.length !== 0) {
                return false;
              }
            }

            return true;
          }
        }, {
          key: "_checkSubCombo",
          value: function _checkSubCombo(subCombo, startingKeyNameIndex, pressedKeyNames) {
            subCombo = subCombo.slice(0);
            pressedKeyNames = pressedKeyNames.slice(startingKeyNameIndex);
            var endIndex = startingKeyNameIndex;

            for (var i = 0; i < subCombo.length; i += 1) {
              var keyName = subCombo[i];

              if (keyName[0] === '\\') {
                var escapedKeyName = keyName.slice(1);

                if (escapedKeyName === KeyCombo.comboDeliminator || escapedKeyName === KeyCombo.keyDeliminator) {
                  keyName = escapedKeyName;
                }
              }

              var index = pressedKeyNames.indexOf(keyName);

              if (index > -1) {
                subCombo.splice(i, 1);
                i -= 1;

                if (index > endIndex) {
                  endIndex = index;
                }

                if (subCombo.length === 0) {
                  return endIndex;
                }
              }
            }

            return -1;
          }
        }]);

        return KeyCombo;
      }();
      KeyCombo.comboDeliminator = '>';
      KeyCombo.keyDeliminator = '+';

      KeyCombo.parseComboStr = function (keyComboStr) {
        var subComboStrs = KeyCombo._splitStr(keyComboStr, KeyCombo.comboDeliminator);

        var combo = [];

        for (var i = 0; i < subComboStrs.length; i += 1) {
          combo.push(KeyCombo._splitStr(subComboStrs[i], KeyCombo.keyDeliminator));
        }

        return combo;
      };

      KeyCombo._splitStr = function (str, deliminator) {
        var s = str;
        var d = deliminator;
        var c = '';
        var ca = [];

        for (var ci = 0; ci < s.length; ci += 1) {
          if (ci > 0 && s[ci] === d && s[ci - 1] !== '\\') {
            ca.push(c.trim());
            c = '';
            ci += 1;
          }

          c += s[ci];
        }

        if (c) {
          ca.push(c.trim());
        }

        return ca;
      };

      var Locale = /*#__PURE__*/function () {
        function Locale(name) {
          _classCallCheck(this, Locale);

          this.localeName = name;
          this.activeTargetKeys = [];
          this.pressedKeys = [];
          this._appliedMacros = [];
          this._keyMap = {};
          this._killKeyCodes = [];
          this._macros = [];
        }

        _createClass(Locale, [{
          key: "bindKeyCode",
          value: function bindKeyCode(keyCode, keyNames) {
            if (typeof keyNames === 'string') {
              keyNames = [keyNames];
            }

            this._keyMap[keyCode] = keyNames;
          }
        }, {
          key: "bindMacro",
          value: function bindMacro(keyComboStr, keyNames) {
            if (typeof keyNames === 'string') {
              keyNames = [keyNames];
            }

            var handler = null;

            if (typeof keyNames === 'function') {
              handler = keyNames;
              keyNames = null;
            }

            var macro = {
              keyCombo: new KeyCombo(keyComboStr),
              keyNames: keyNames,
              handler: handler
            };

            this._macros.push(macro);
          }
        }, {
          key: "getKeyCodes",
          value: function getKeyCodes(keyName) {
            var keyCodes = [];

            for (var keyCode in this._keyMap) {
              var index = this._keyMap[keyCode].indexOf(keyName);

              if (index > -1) {
                keyCodes.push(keyCode | 0);
              }
            }

            return keyCodes;
          }
        }, {
          key: "getKeyNames",
          value: function getKeyNames(keyCode) {
            return this._keyMap[keyCode] || [];
          }
        }, {
          key: "setKillKey",
          value: function setKillKey(keyCode) {
            if (typeof keyCode === 'string') {
              var keyCodes = this.getKeyCodes(keyCode);

              for (var i = 0; i < keyCodes.length; i += 1) {
                this.setKillKey(keyCodes[i]);
              }

              return;
            }

            this._killKeyCodes.push(keyCode);
          }
        }, {
          key: "pressKey",
          value: function pressKey(keyCode) {
            if (typeof keyCode === 'string') {
              var keyCodes = this.getKeyCodes(keyCode);

              for (var i = 0; i < keyCodes.length; i += 1) {
                this.pressKey(keyCodes[i]);
              }

              return;
            }

            this.activeTargetKeys.length = 0;
            var keyNames = this.getKeyNames(keyCode);

            for (var _i = 0; _i < keyNames.length; _i += 1) {
              this.activeTargetKeys.push(keyNames[_i]);

              if (this.pressedKeys.indexOf(keyNames[_i]) === -1) {
                this.pressedKeys.push(keyNames[_i]);
              }
            }

            this._applyMacros();
          }
        }, {
          key: "releaseKey",
          value: function releaseKey(keyCode) {
            if (typeof keyCode === 'string') {
              var keyCodes = this.getKeyCodes(keyCode);

              for (var i = 0; i < keyCodes.length; i += 1) {
                this.releaseKey(keyCodes[i]);
              }
            } else {
              var keyNames = this.getKeyNames(keyCode);

              var killKeyCodeIndex = this._killKeyCodes.indexOf(keyCode);

              if (killKeyCodeIndex !== -1) {
                this.pressedKeys.length = 0;
              } else {
                for (var _i2 = 0; _i2 < keyNames.length; _i2 += 1) {
                  var index = this.pressedKeys.indexOf(keyNames[_i2]);

                  if (index > -1) {
                    this.pressedKeys.splice(index, 1);
                  }
                }
              }

              this.activeTargetKeys.length = 0;

              this._clearMacros();
            }
          }
        }, {
          key: "_applyMacros",
          value: function _applyMacros() {
            var macros = this._macros.slice(0);

            for (var i = 0; i < macros.length; i += 1) {
              var macro = macros[i];

              if (macro.keyCombo.check(this.pressedKeys)) {
                if (macro.handler) {
                  macro.keyNames = macro.handler(this.pressedKeys);
                }

                for (var j = 0; j < macro.keyNames.length; j += 1) {
                  if (this.pressedKeys.indexOf(macro.keyNames[j]) === -1) {
                    this.pressedKeys.push(macro.keyNames[j]);
                  }
                }

                this._appliedMacros.push(macro);
              }
            }
          }
        }, {
          key: "_clearMacros",
          value: function _clearMacros() {
            for (var i = 0; i < this._appliedMacros.length; i += 1) {
              var macro = this._appliedMacros[i];

              if (!macro.keyCombo.check(this.pressedKeys)) {
                for (var j = 0; j < macro.keyNames.length; j += 1) {
                  var index = this.pressedKeys.indexOf(macro.keyNames[j]);

                  if (index > -1) {
                    this.pressedKeys.splice(index, 1);
                  }
                }

                if (macro.handler) {
                  macro.keyNames = null;
                }

                this._appliedMacros.splice(i, 1);

                i -= 1;
              }
            }
          }
        }]);

        return Locale;
      }();

      var Keyboard = /*#__PURE__*/function () {
        function Keyboard(targetWindow, targetElement, targetPlatform, targetUserAgent) {
          _classCallCheck(this, Keyboard);

          this._locale = null;
          this._currentContext = '';
          this._contexts = {};
          this._listeners = [];
          this._appliedListeners = [];
          this._locales = {};
          this._targetElement = null;
          this._targetWindow = null;
          this._targetPlatform = '';
          this._targetUserAgent = '';
          this._isModernBrowser = false;
          this._targetKeyDownBinding = null;
          this._targetKeyUpBinding = null;
          this._targetResetBinding = null;
          this._paused = false;
          this._contexts.global = {
            listeners: this._listeners,
            targetWindow: targetWindow,
            targetElement: targetElement,
            targetPlatform: targetPlatform,
            targetUserAgent: targetUserAgent
          };
          this.setContext('global');
        }

        _createClass(Keyboard, [{
          key: "setLocale",
          value: function setLocale(localeName, localeBuilder) {
            var locale = null;

            if (typeof localeName === 'string') {
              if (localeBuilder) {
                locale = new Locale(localeName);
                localeBuilder(locale, this._targetPlatform, this._targetUserAgent);
              } else {
                locale = this._locales[localeName] || null;
              }
            } else {
              locale = localeName;
              localeName = locale._localeName;
            }

            this._locale = locale;
            this._locales[localeName] = locale;

            if (locale) {
              this._locale.pressedKeys = locale.pressedKeys;
            }

            return this;
          }
        }, {
          key: "getLocale",
          value: function getLocale(localName) {
            localName || (localName = this._locale.localeName);
            return this._locales[localName] || null;
          }
        }, {
          key: "bind",
          value: function bind(keyComboStr, pressHandler, releaseHandler, preventRepeatByDefault) {
            if (keyComboStr === null || typeof keyComboStr === 'function') {
              preventRepeatByDefault = releaseHandler;
              releaseHandler = pressHandler;
              pressHandler = keyComboStr;
              keyComboStr = null;
            }

            if (keyComboStr && _typeof(keyComboStr) === 'object' && typeof keyComboStr.length === 'number') {
              for (var i = 0; i < keyComboStr.length; i += 1) {
                this.bind(keyComboStr[i], pressHandler, releaseHandler);
              }

              return this;
            }

            this._listeners.push({
              keyCombo: keyComboStr ? new KeyCombo(keyComboStr) : null,
              pressHandler: pressHandler || null,
              releaseHandler: releaseHandler || null,
              preventRepeat: preventRepeatByDefault || false,
              preventRepeatByDefault: preventRepeatByDefault || false,
              executingHandler: false
            });

            return this;
          }
        }, {
          key: "addListener",
          value: function addListener(keyComboStr, pressHandler, releaseHandler, preventRepeatByDefault) {
            return this.bind(keyComboStr, pressHandler, releaseHandler, preventRepeatByDefault);
          }
        }, {
          key: "on",
          value: function on(keyComboStr, pressHandler, releaseHandler, preventRepeatByDefault) {
            return this.bind(keyComboStr, pressHandler, releaseHandler, preventRepeatByDefault);
          }
        }, {
          key: "bindPress",
          value: function bindPress(keyComboStr, pressHandler, preventRepeatByDefault) {
            return this.bind(keyComboStr, pressHandler, null, preventRepeatByDefault);
          }
        }, {
          key: "bindRelease",
          value: function bindRelease(keyComboStr, releaseHandler) {
            return this.bind(keyComboStr, null, releaseHandler, preventRepeatByDefault);
          }
        }, {
          key: "unbind",
          value: function unbind(keyComboStr, pressHandler, releaseHandler) {
            if (keyComboStr === null || typeof keyComboStr === 'function') {
              releaseHandler = pressHandler;
              pressHandler = keyComboStr;
              keyComboStr = null;
            }

            if (keyComboStr && _typeof(keyComboStr) === 'object' && typeof keyComboStr.length === 'number') {
              for (var i = 0; i < keyComboStr.length; i += 1) {
                this.unbind(keyComboStr[i], pressHandler, releaseHandler);
              }

              return this;
            }

            for (var _i = 0; _i < this._listeners.length; _i += 1) {
              var listener = this._listeners[_i];
              var comboMatches = !keyComboStr && !listener.keyCombo || listener.keyCombo && listener.keyCombo.isEqual(keyComboStr);
              var pressHandlerMatches = !pressHandler && !releaseHandler || !pressHandler && !listener.pressHandler || pressHandler === listener.pressHandler;
              var releaseHandlerMatches = !pressHandler && !releaseHandler || !releaseHandler && !listener.releaseHandler || releaseHandler === listener.releaseHandler;

              if (comboMatches && pressHandlerMatches && releaseHandlerMatches) {
                this._listeners.splice(_i, 1);

                _i -= 1;
              }
            }

            return this;
          }
        }, {
          key: "removeListener",
          value: function removeListener(keyComboStr, pressHandler, releaseHandler) {
            return this.unbind(keyComboStr, pressHandler, releaseHandler);
          }
        }, {
          key: "off",
          value: function off(keyComboStr, pressHandler, releaseHandler) {
            return this.unbind(keyComboStr, pressHandler, releaseHandler);
          }
        }, {
          key: "setContext",
          value: function setContext(contextName) {
            if (this._locale) {
              this.releaseAllKeys();
            }

            if (!this._contexts[contextName]) {
              var globalContext = this._contexts.global;
              this._contexts[contextName] = {
                listeners: [],
                targetWindow: globalContext.targetWindow,
                targetElement: globalContext.targetElement,
                targetPlatform: globalContext.targetPlatform,
                targetUserAgent: globalContext.targetUserAgent
              };
            }

            var context = this._contexts[contextName];
            this._currentContext = contextName;
            this._listeners = context.listeners;
            this.stop();
            this.watch(context.targetWindow, context.targetElement, context.targetPlatform, context.targetUserAgent);
            return this;
          }
        }, {
          key: "getContext",
          value: function getContext() {
            return this._currentContext;
          }
        }, {
          key: "withContext",
          value: function withContext(contextName, callback) {
            var previousContextName = this.getContext();
            this.setContext(contextName);
            callback();
            this.setContext(previousContextName);
            return this;
          }
        }, {
          key: "watch",
          value: function watch(targetWindow, targetElement, targetPlatform, targetUserAgent) {
            var _this = this;

            this.stop();
            var win = typeof globalThis !== 'undefined' ? globalThis : typeof commonjsGlobal !== 'undefined' ? commonjsGlobal : typeof window !== 'undefined' ? window : {};

            if (!targetWindow) {
              if (!win.addEventListener && !win.attachEvent) {
                throw new Error('Cannot find window functions addEventListener or attachEvent.');
              }

              targetWindow = win;
            } // Handle element bindings where a target window is not passed


            if (typeof targetWindow.nodeType === 'number') {
              targetUserAgent = targetPlatform;
              targetPlatform = targetElement;
              targetElement = targetWindow;
              targetWindow = win;
            }

            if (!targetWindow.addEventListener && !targetWindow.attachEvent) {
              throw new Error('Cannot find addEventListener or attachEvent methods on targetWindow.');
            }

            this._isModernBrowser = !!targetWindow.addEventListener;
            var userAgent = targetWindow.navigator && targetWindow.navigator.userAgent || '';
            var platform = targetWindow.navigator && targetWindow.navigator.platform || '';
            targetElement && targetElement !== null || (targetElement = targetWindow.document);
            targetPlatform && targetPlatform !== null || (targetPlatform = platform);
            targetUserAgent && targetUserAgent !== null || (targetUserAgent = userAgent);

            this._targetKeyDownBinding = function (event) {
              _this.pressKey(event.keyCode, event);

              _this._handleCommandBug(event, platform);
            };

            this._targetKeyUpBinding = function (event) {
              _this.releaseKey(event.keyCode, event);
            };

            this._targetResetBinding = function (event) {
              _this.releaseAllKeys(event);
            };

            this._bindEvent(targetElement, 'keydown', this._targetKeyDownBinding);

            this._bindEvent(targetElement, 'keyup', this._targetKeyUpBinding);

            this._bindEvent(targetWindow, 'focus', this._targetResetBinding);

            this._bindEvent(targetWindow, 'blur', this._targetResetBinding);

            this._targetElement = targetElement;
            this._targetWindow = targetWindow;
            this._targetPlatform = targetPlatform;
            this._targetUserAgent = targetUserAgent;
            var currentContext = this._contexts[this._currentContext];
            currentContext.targetWindow = this._targetWindow;
            currentContext.targetElement = this._targetElement;
            currentContext.targetPlatform = this._targetPlatform;
            currentContext.targetUserAgent = this._targetUserAgent;
            return this;
          }
        }, {
          key: "stop",
          value: function stop() {
            if (!this._targetElement || !this._targetWindow) {
              return;
            }

            this._unbindEvent(this._targetElement, 'keydown', this._targetKeyDownBinding);

            this._unbindEvent(this._targetElement, 'keyup', this._targetKeyUpBinding);

            this._unbindEvent(this._targetWindow, 'focus', this._targetResetBinding);

            this._unbindEvent(this._targetWindow, 'blur', this._targetResetBinding);

            this._targetWindow = null;
            this._targetElement = null;
            return this;
          }
        }, {
          key: "pressKey",
          value: function pressKey(keyCode, event) {
            if (this._paused) {
              return this;
            }

            if (!this._locale) {
              throw new Error('Locale not set');
            }

            this._locale.pressKey(keyCode);

            this._applyBindings(event);

            return this;
          }
        }, {
          key: "releaseKey",
          value: function releaseKey(keyCode, event) {
            if (this._paused) {
              return this;
            }

            if (!this._locale) {
              throw new Error('Locale not set');
            }

            this._locale.releaseKey(keyCode);

            this._clearBindings(event);

            return this;
          }
        }, {
          key: "releaseAllKeys",
          value: function releaseAllKeys(event) {
            if (this._paused) {
              return this;
            }

            if (!this._locale) {
              throw new Error('Locale not set');
            }

            this._locale.pressedKeys.length = 0;

            this._clearBindings(event);

            return this;
          }
        }, {
          key: "pause",
          value: function pause() {
            if (this._paused) {
              return this;
            }

            if (this._locale) {
              this.releaseAllKeys();
            }

            this._paused = true;
            return this;
          }
        }, {
          key: "resume",
          value: function resume() {
            this._paused = false;
            return this;
          }
        }, {
          key: "reset",
          value: function reset() {
            this.releaseAllKeys();
            this._listeners.length = 0;
            return this;
          }
        }, {
          key: "_bindEvent",
          value: function _bindEvent(targetElement, eventName, handler) {
            return this._isModernBrowser ? targetElement.addEventListener(eventName, handler, false) : targetElement.attachEvent('on' + eventName, handler);
          }
        }, {
          key: "_unbindEvent",
          value: function _unbindEvent(targetElement, eventName, handler) {
            return this._isModernBrowser ? targetElement.removeEventListener(eventName, handler, false) : targetElement.detachEvent('on' + eventName, handler);
          }
        }, {
          key: "_getGroupedListeners",
          value: function _getGroupedListeners() {
            var listenerGroups = [];
            var listenerGroupMap = [];
            var listeners = this._listeners;

            if (this._currentContext !== 'global') {
              listeners = [].concat(_toConsumableArray(listeners), _toConsumableArray(this._contexts.global.listeners));
            }

            listeners.sort(function (a, b) {
              return (b.keyCombo ? b.keyCombo.keyNames.length : 0) - (a.keyCombo ? a.keyCombo.keyNames.length : 0);
            }).forEach(function (l) {
              var mapIndex = -1;

              for (var i = 0; i < listenerGroupMap.length; i += 1) {
                if (listenerGroupMap[i] === null && l.keyCombo === null || listenerGroupMap[i] !== null && listenerGroupMap[i].isEqual(l.keyCombo)) {
                  mapIndex = i;
                }
              }

              if (mapIndex === -1) {
                mapIndex = listenerGroupMap.length;
                listenerGroupMap.push(l.keyCombo);
              }

              if (!listenerGroups[mapIndex]) {
                listenerGroups[mapIndex] = [];
              }

              listenerGroups[mapIndex].push(l);
            });
            return listenerGroups;
          }
        }, {
          key: "_applyBindings",
          value: function _applyBindings(event) {
            var _this2 = this;

            var preventRepeat = false;
            event || (event = {});

            event.preventRepeat = function () {
              preventRepeat = true;
            };

            event.pressedKeys = this._locale.pressedKeys.slice(0);
            var activeTargetKeys = this._locale.activeTargetKeys;

            var pressedKeys = this._locale.pressedKeys.slice(0);

            var listenerGroups = this._getGroupedListeners();

            var _loop = function _loop(i) {
              var listeners = listenerGroups[i];
              var keyCombo = listeners[0].keyCombo;

              if (keyCombo === null || keyCombo.check(pressedKeys) && activeTargetKeys.some(function (k) {
                return keyCombo.keyNames.includes(k);
              })) {
                for (var j = 0; j < listeners.length; j += 1) {
                  var listener = listeners[j];

                  if (!listener.executingHandler && listener.pressHandler && !listener.preventRepeat) {
                    listener.executingHandler = true;
                    listener.pressHandler.call(_this2, event);
                    listener.executingHandler = false;

                    if (preventRepeat || listener.preventRepeatByDefault) {
                      listener.preventRepeat = true;
                      preventRepeat = false;
                    }
                  }

                  if (_this2._appliedListeners.indexOf(listener) === -1) {
                    _this2._appliedListeners.push(listener);
                  }
                }

                if (keyCombo) {
                  for (var _j = 0; _j < keyCombo.keyNames.length; _j += 1) {
                    var index = pressedKeys.indexOf(keyCombo.keyNames[_j]);

                    if (index !== -1) {
                      pressedKeys.splice(index, 1);
                      _j -= 1;
                    }
                  }
                }
              }
            };

            for (var i = 0; i < listenerGroups.length; i += 1) {
              _loop(i);
            }
          }
        }, {
          key: "_clearBindings",
          value: function _clearBindings(event) {
            event || (event = {});
            event.pressedKeys = this._locale.pressedKeys.slice(0);

            for (var i = 0; i < this._appliedListeners.length; i += 1) {
              var listener = this._appliedListeners[i];
              var keyCombo = listener.keyCombo;

              if (keyCombo === null || !keyCombo.check(this._locale.pressedKeys)) {
                listener.preventRepeat = false;

                if (keyCombo !== null || event.pressedKeys.length === 0) {
                  this._appliedListeners.splice(i, 1);

                  i -= 1;
                }

                if (!listener.executingHandler && listener.releaseHandler) {
                  listener.executingHandler = true;
                  listener.releaseHandler.call(this, event);
                  listener.executingHandler = false;
                }
              }
            }
          }
        }, {
          key: "_handleCommandBug",
          value: function _handleCommandBug(event, platform) {
            // On Mac when the command key is kept pressed, keyup is not triggered for any other key.
            // In this case force a keyup for non-modifier keys directly after the keypress.
            var modifierKeys = ["shift", "ctrl", "alt", "capslock", "tab", "command"];

            if (platform.match("Mac") && this._locale.pressedKeys.includes("command") && !modifierKeys.includes(this._locale.getKeyNames(event.keyCode)[0])) {
              this._targetKeyUpBinding(event);
            }
          }
        }]);

        return Keyboard;
      }();

      function us(locale, platform, userAgent) {
        // general
        locale.bindKeyCode(3, ['cancel']);
        locale.bindKeyCode(8, ['backspace']);
        locale.bindKeyCode(9, ['tab']);
        locale.bindKeyCode(12, ['clear']);
        locale.bindKeyCode(13, ['enter']);
        locale.bindKeyCode(16, ['shift']);
        locale.bindKeyCode(17, ['ctrl']);
        locale.bindKeyCode(18, ['alt', 'menu']);
        locale.bindKeyCode(19, ['pause', 'break']);
        locale.bindKeyCode(20, ['capslock']);
        locale.bindKeyCode(27, ['escape', 'esc']);
        locale.bindKeyCode(32, ['space', 'spacebar']);
        locale.bindKeyCode(33, ['pageup']);
        locale.bindKeyCode(34, ['pagedown']);
        locale.bindKeyCode(35, ['end']);
        locale.bindKeyCode(36, ['home']);
        locale.bindKeyCode(37, ['left']);
        locale.bindKeyCode(38, ['up']);
        locale.bindKeyCode(39, ['right']);
        locale.bindKeyCode(40, ['down']);
        locale.bindKeyCode(41, ['select']);
        locale.bindKeyCode(42, ['printscreen']);
        locale.bindKeyCode(43, ['execute']);
        locale.bindKeyCode(44, ['snapshot']);
        locale.bindKeyCode(45, ['insert', 'ins']);
        locale.bindKeyCode(46, ['delete', 'del']);
        locale.bindKeyCode(47, ['help']);
        locale.bindKeyCode(145, ['scrolllock', 'scroll']);
        locale.bindKeyCode(188, ['comma', ',']);
        locale.bindKeyCode(190, ['period', '.']);
        locale.bindKeyCode(191, ['slash', 'forwardslash', '/']);
        locale.bindKeyCode(192, ['graveaccent', '`']);
        locale.bindKeyCode(219, ['openbracket', '[']);
        locale.bindKeyCode(220, ['backslash', '\\']);
        locale.bindKeyCode(221, ['closebracket', ']']);
        locale.bindKeyCode(222, ['apostrophe', '\'']); // 0-9

        locale.bindKeyCode(48, ['zero', '0']);
        locale.bindKeyCode(49, ['one', '1']);
        locale.bindKeyCode(50, ['two', '2']);
        locale.bindKeyCode(51, ['three', '3']);
        locale.bindKeyCode(52, ['four', '4']);
        locale.bindKeyCode(53, ['five', '5']);
        locale.bindKeyCode(54, ['six', '6']);
        locale.bindKeyCode(55, ['seven', '7']);
        locale.bindKeyCode(56, ['eight', '8']);
        locale.bindKeyCode(57, ['nine', '9']); // numpad

        locale.bindKeyCode(96, ['numzero', 'num0']);
        locale.bindKeyCode(97, ['numone', 'num1']);
        locale.bindKeyCode(98, ['numtwo', 'num2']);
        locale.bindKeyCode(99, ['numthree', 'num3']);
        locale.bindKeyCode(100, ['numfour', 'num4']);
        locale.bindKeyCode(101, ['numfive', 'num5']);
        locale.bindKeyCode(102, ['numsix', 'num6']);
        locale.bindKeyCode(103, ['numseven', 'num7']);
        locale.bindKeyCode(104, ['numeight', 'num8']);
        locale.bindKeyCode(105, ['numnine', 'num9']);
        locale.bindKeyCode(106, ['nummultiply', 'num*']);
        locale.bindKeyCode(107, ['numadd', 'num+']);
        locale.bindKeyCode(108, ['numenter']);
        locale.bindKeyCode(109, ['numsubtract', 'num-']);
        locale.bindKeyCode(110, ['numdecimal', 'num.']);
        locale.bindKeyCode(111, ['numdivide', 'num/']);
        locale.bindKeyCode(144, ['numlock', 'num']); // function keys

        locale.bindKeyCode(112, ['f1']);
        locale.bindKeyCode(113, ['f2']);
        locale.bindKeyCode(114, ['f3']);
        locale.bindKeyCode(115, ['f4']);
        locale.bindKeyCode(116, ['f5']);
        locale.bindKeyCode(117, ['f6']);
        locale.bindKeyCode(118, ['f7']);
        locale.bindKeyCode(119, ['f8']);
        locale.bindKeyCode(120, ['f9']);
        locale.bindKeyCode(121, ['f10']);
        locale.bindKeyCode(122, ['f11']);
        locale.bindKeyCode(123, ['f12']);
        locale.bindKeyCode(124, ['f13']);
        locale.bindKeyCode(125, ['f14']);
        locale.bindKeyCode(126, ['f15']);
        locale.bindKeyCode(127, ['f16']);
        locale.bindKeyCode(128, ['f17']);
        locale.bindKeyCode(129, ['f18']);
        locale.bindKeyCode(130, ['f19']);
        locale.bindKeyCode(131, ['f20']);
        locale.bindKeyCode(132, ['f21']);
        locale.bindKeyCode(133, ['f22']);
        locale.bindKeyCode(134, ['f23']);
        locale.bindKeyCode(135, ['f24']); // secondary key symbols

        locale.bindMacro('shift + `', ['tilde', '~']);
        locale.bindMacro('shift + 1', ['exclamation', 'exclamationpoint', '!']);
        locale.bindMacro('shift + 2', ['at', '@']);
        locale.bindMacro('shift + 3', ['number', '#']);
        locale.bindMacro('shift + 4', ['dollar', 'dollars', 'dollarsign', '$']);
        locale.bindMacro('shift + 5', ['percent', '%']);
        locale.bindMacro('shift + 6', ['caret', '^']);
        locale.bindMacro('shift + 7', ['ampersand', 'and', '&']);
        locale.bindMacro('shift + 8', ['asterisk', '*']);
        locale.bindMacro('shift + 9', ['openparen', '(']);
        locale.bindMacro('shift + 0', ['closeparen', ')']);
        locale.bindMacro('shift + -', ['underscore', '_']);
        locale.bindMacro('shift + =', ['plus', '+']);
        locale.bindMacro('shift + [', ['opencurlybrace', 'opencurlybracket', '{']);
        locale.bindMacro('shift + ]', ['closecurlybrace', 'closecurlybracket', '}']);
        locale.bindMacro('shift + \\', ['verticalbar', '|']);
        locale.bindMacro('shift + ;', ['colon', ':']);
        locale.bindMacro('shift + \'', ['quotationmark', '\'']);
        locale.bindMacro('shift + !,', ['openanglebracket', '<']);
        locale.bindMacro('shift + .', ['closeanglebracket', '>']);
        locale.bindMacro('shift + /', ['questionmark', '?']);

        if (platform.match('Mac')) {
          locale.bindMacro('command', ['mod', 'modifier']);
        } else {
          locale.bindMacro('ctrl', ['mod', 'modifier']);
        } //a-z and A-Z


        for (var keyCode = 65; keyCode <= 90; keyCode += 1) {
          var keyName = String.fromCharCode(keyCode + 32);
          var capitalKeyName = String.fromCharCode(keyCode);
          locale.bindKeyCode(keyCode, keyName);
          locale.bindMacro('shift + ' + keyName, capitalKeyName);
          locale.bindMacro('capslock + ' + keyName, capitalKeyName);
        } // browser caveats


        var semicolonKeyCode = userAgent.match('Firefox') ? 59 : 186;
        var dashKeyCode = userAgent.match('Firefox') ? 173 : 189;
        var equalKeyCode = userAgent.match('Firefox') ? 61 : 187;
        var leftCommandKeyCode;
        var rightCommandKeyCode;

        if (platform.match('Mac') && (userAgent.match('Safari') || userAgent.match('Chrome'))) {
          leftCommandKeyCode = 91;
          rightCommandKeyCode = 93;
        } else if (platform.match('Mac') && userAgent.match('Opera')) {
          leftCommandKeyCode = 17;
          rightCommandKeyCode = 17;
        } else if (platform.match('Mac') && userAgent.match('Firefox')) {
          leftCommandKeyCode = 224;
          rightCommandKeyCode = 224;
        }

        locale.bindKeyCode(semicolonKeyCode, ['semicolon', ';']);
        locale.bindKeyCode(dashKeyCode, ['dash', '-']);
        locale.bindKeyCode(equalKeyCode, ['equal', 'equalsign', '=']);
        locale.bindKeyCode(leftCommandKeyCode, ['command', 'windows', 'win', 'super', 'leftcommand', 'leftwindows', 'leftwin', 'leftsuper']);
        locale.bindKeyCode(rightCommandKeyCode, ['command', 'windows', 'win', 'super', 'rightcommand', 'rightwindows', 'rightwin', 'rightsuper']); // kill keys

        locale.setKillKey('command');
      }

      var keyboard = new Keyboard();
      keyboard.setLocale('us', us);
      keyboard.Keyboard = Keyboard;
      keyboard.Locale = Locale;
      keyboard.KeyCombo = KeyCombo;

      return keyboard;

    })));
    //# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5Ym9hcmQuanMiLCJzb3VyY2VzIjpbIi4uL2xpYi9rZXktY29tYm8uanMiLCIuLi9saWIvbG9jYWxlLmpzIiwiLi4vbGliL2tleWJvYXJkLmpzIiwiLi4vbG9jYWxlcy91cy5qcyIsIi4uL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIlxuZXhwb3J0IGNsYXNzIEtleUNvbWJvIHtcbiAgY29uc3RydWN0b3Ioa2V5Q29tYm9TdHIpIHtcbiAgICB0aGlzLnNvdXJjZVN0ciA9IGtleUNvbWJvU3RyO1xuICAgIHRoaXMuc3ViQ29tYm9zID0gS2V5Q29tYm8ucGFyc2VDb21ib1N0cihrZXlDb21ib1N0cik7XG4gICAgdGhpcy5rZXlOYW1lcyAgPSB0aGlzLnN1YkNvbWJvcy5yZWR1Y2UoKG1lbW8sIG5leHRTdWJDb21ibykgPT5cbiAgICAgIG1lbW8uY29uY2F0KG5leHRTdWJDb21ibyksIFtdKTtcbiAgfVxuXG4gIGNoZWNrKHByZXNzZWRLZXlOYW1lcykge1xuICAgIGxldCBzdGFydGluZ0tleU5hbWVJbmRleCA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnN1YkNvbWJvcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgc3RhcnRpbmdLZXlOYW1lSW5kZXggPSB0aGlzLl9jaGVja1N1YkNvbWJvKFxuICAgICAgICB0aGlzLnN1YkNvbWJvc1tpXSxcbiAgICAgICAgc3RhcnRpbmdLZXlOYW1lSW5kZXgsXG4gICAgICAgIHByZXNzZWRLZXlOYW1lc1xuICAgICAgKTtcbiAgICAgIGlmIChzdGFydGluZ0tleU5hbWVJbmRleCA9PT0gLTEpIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gIGlzRXF1YWwob3RoZXJLZXlDb21ibykge1xuICAgIGlmIChcbiAgICAgICFvdGhlcktleUNvbWJvIHx8XG4gICAgICB0eXBlb2Ygb3RoZXJLZXlDb21ibyAhPT0gJ3N0cmluZycgJiZcbiAgICAgIHR5cGVvZiBvdGhlcktleUNvbWJvICE9PSAnb2JqZWN0J1xuICAgICkgeyByZXR1cm4gZmFsc2U7IH1cblxuICAgIGlmICh0eXBlb2Ygb3RoZXJLZXlDb21ibyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIG90aGVyS2V5Q29tYm8gPSBuZXcgS2V5Q29tYm8ob3RoZXJLZXlDb21ibyk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc3ViQ29tYm9zLmxlbmd0aCAhPT0gb3RoZXJLZXlDb21iby5zdWJDb21ib3MubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5zdWJDb21ib3MubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIGlmICh0aGlzLnN1YkNvbWJvc1tpXS5sZW5ndGggIT09IG90aGVyS2V5Q29tYm8uc3ViQ29tYm9zW2ldLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnN1YkNvbWJvcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgY29uc3Qgc3ViQ29tYm8gICAgICA9IHRoaXMuc3ViQ29tYm9zW2ldO1xuICAgICAgY29uc3Qgb3RoZXJTdWJDb21ibyA9IG90aGVyS2V5Q29tYm8uc3ViQ29tYm9zW2ldLnNsaWNlKDApO1xuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHN1YkNvbWJvLmxlbmd0aDsgaiArPSAxKSB7XG4gICAgICAgIGNvbnN0IGtleU5hbWUgPSBzdWJDb21ib1tqXTtcbiAgICAgICAgY29uc3QgaW5kZXggICA9IG90aGVyU3ViQ29tYm8uaW5kZXhPZihrZXlOYW1lKTtcblxuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgIG90aGVyU3ViQ29tYm8uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKG90aGVyU3ViQ29tYm8ubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICBfY2hlY2tTdWJDb21ibyhzdWJDb21ibywgc3RhcnRpbmdLZXlOYW1lSW5kZXgsIHByZXNzZWRLZXlOYW1lcykge1xuICAgIHN1YkNvbWJvID0gc3ViQ29tYm8uc2xpY2UoMCk7XG4gICAgcHJlc3NlZEtleU5hbWVzID0gcHJlc3NlZEtleU5hbWVzLnNsaWNlKHN0YXJ0aW5nS2V5TmFtZUluZGV4KTtcblxuICAgIGxldCBlbmRJbmRleCA9IHN0YXJ0aW5nS2V5TmFtZUluZGV4O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3ViQ29tYm8ubGVuZ3RoOyBpICs9IDEpIHtcblxuICAgICAgbGV0IGtleU5hbWUgPSBzdWJDb21ib1tpXTtcbiAgICAgIGlmIChrZXlOYW1lWzBdID09PSAnXFxcXCcpIHtcbiAgICAgICAgY29uc3QgZXNjYXBlZEtleU5hbWUgPSBrZXlOYW1lLnNsaWNlKDEpO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgZXNjYXBlZEtleU5hbWUgPT09IEtleUNvbWJvLmNvbWJvRGVsaW1pbmF0b3IgfHxcbiAgICAgICAgICBlc2NhcGVkS2V5TmFtZSA9PT0gS2V5Q29tYm8ua2V5RGVsaW1pbmF0b3JcbiAgICAgICAgKSB7XG4gICAgICAgICAga2V5TmFtZSA9IGVzY2FwZWRLZXlOYW1lO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGluZGV4ID0gcHJlc3NlZEtleU5hbWVzLmluZGV4T2Yoa2V5TmFtZSk7XG4gICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICBzdWJDb21iby5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGkgLT0gMTtcbiAgICAgICAgaWYgKGluZGV4ID4gZW5kSW5kZXgpIHtcbiAgICAgICAgICBlbmRJbmRleCA9IGluZGV4O1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdWJDb21iby5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICByZXR1cm4gZW5kSW5kZXg7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIC0xO1xuICB9O1xufVxuXG5LZXlDb21iby5jb21ib0RlbGltaW5hdG9yID0gJz4nO1xuS2V5Q29tYm8ua2V5RGVsaW1pbmF0b3IgICA9ICcrJztcblxuS2V5Q29tYm8ucGFyc2VDb21ib1N0ciA9IGZ1bmN0aW9uKGtleUNvbWJvU3RyKSB7XG4gIGNvbnN0IHN1YkNvbWJvU3RycyA9IEtleUNvbWJvLl9zcGxpdFN0cihrZXlDb21ib1N0ciwgS2V5Q29tYm8uY29tYm9EZWxpbWluYXRvcik7XG4gIGNvbnN0IGNvbWJvICAgICAgICA9IFtdO1xuXG4gIGZvciAobGV0IGkgPSAwIDsgaSA8IHN1YkNvbWJvU3Rycy5sZW5ndGg7IGkgKz0gMSkge1xuICAgIGNvbWJvLnB1c2goS2V5Q29tYm8uX3NwbGl0U3RyKHN1YkNvbWJvU3Ryc1tpXSwgS2V5Q29tYm8ua2V5RGVsaW1pbmF0b3IpKTtcbiAgfVxuICByZXR1cm4gY29tYm87XG59XG5cbktleUNvbWJvLl9zcGxpdFN0ciA9IGZ1bmN0aW9uKHN0ciwgZGVsaW1pbmF0b3IpIHtcbiAgY29uc3QgcyAgPSBzdHI7XG4gIGNvbnN0IGQgID0gZGVsaW1pbmF0b3I7XG4gIGxldCBjICA9ICcnO1xuICBjb25zdCBjYSA9IFtdO1xuXG4gIGZvciAobGV0IGNpID0gMDsgY2kgPCBzLmxlbmd0aDsgY2kgKz0gMSkge1xuICAgIGlmIChjaSA+IDAgJiYgc1tjaV0gPT09IGQgJiYgc1tjaSAtIDFdICE9PSAnXFxcXCcpIHtcbiAgICAgIGNhLnB1c2goYy50cmltKCkpO1xuICAgICAgYyA9ICcnO1xuICAgICAgY2kgKz0gMTtcbiAgICB9XG4gICAgYyArPSBzW2NpXTtcbiAgfVxuICBpZiAoYykgeyBjYS5wdXNoKGMudHJpbSgpKTsgfVxuXG4gIHJldHVybiBjYTtcbn07XG4iLCJpbXBvcnQgeyBLZXlDb21ibyB9IGZyb20gJy4va2V5LWNvbWJvJztcblxuXG5leHBvcnQgY2xhc3MgTG9jYWxlIHtcbiAgY29uc3RydWN0b3IobmFtZSkge1xuICAgIHRoaXMubG9jYWxlTmFtZSAgICAgICAgICA9IG5hbWU7XG4gICAgdGhpcy5hY3RpdmVUYXJnZXRLZXlzID0gW107XG4gICAgdGhpcy5wcmVzc2VkS2V5cyAgICAgICAgID0gW107XG4gICAgdGhpcy5fYXBwbGllZE1hY3JvcyAgICAgID0gW107XG4gICAgdGhpcy5fa2V5TWFwICAgICAgICAgICAgID0ge307XG4gICAgdGhpcy5fa2lsbEtleUNvZGVzICAgICAgID0gW107XG4gICAgdGhpcy5fbWFjcm9zICAgICAgICAgICAgID0gW107XG4gIH1cblxuICBiaW5kS2V5Q29kZShrZXlDb2RlLCBrZXlOYW1lcykge1xuICAgIGlmICh0eXBlb2Yga2V5TmFtZXMgPT09ICdzdHJpbmcnKSB7XG4gICAgICBrZXlOYW1lcyA9IFtrZXlOYW1lc107XG4gICAgfVxuXG4gICAgdGhpcy5fa2V5TWFwW2tleUNvZGVdID0ga2V5TmFtZXM7XG4gIH07XG5cbiAgYmluZE1hY3JvKGtleUNvbWJvU3RyLCBrZXlOYW1lcykge1xuICAgIGlmICh0eXBlb2Yga2V5TmFtZXMgPT09ICdzdHJpbmcnKSB7XG4gICAgICBrZXlOYW1lcyA9IFsga2V5TmFtZXMgXTtcbiAgICB9XG5cbiAgICBsZXQgaGFuZGxlciA9IG51bGw7XG4gICAgaWYgKHR5cGVvZiBrZXlOYW1lcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgaGFuZGxlciA9IGtleU5hbWVzO1xuICAgICAga2V5TmFtZXMgPSBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IG1hY3JvID0ge1xuICAgICAga2V5Q29tYm8gOiBuZXcgS2V5Q29tYm8oa2V5Q29tYm9TdHIpLFxuICAgICAga2V5TmFtZXMgOiBrZXlOYW1lcyxcbiAgICAgIGhhbmRsZXIgIDogaGFuZGxlclxuICAgIH07XG5cbiAgICB0aGlzLl9tYWNyb3MucHVzaChtYWNybyk7XG4gIH07XG5cbiAgZ2V0S2V5Q29kZXMoa2V5TmFtZSkge1xuICAgIGNvbnN0IGtleUNvZGVzID0gW107XG4gICAgZm9yIChjb25zdCBrZXlDb2RlIGluIHRoaXMuX2tleU1hcCkge1xuICAgICAgY29uc3QgaW5kZXggPSB0aGlzLl9rZXlNYXBba2V5Q29kZV0uaW5kZXhPZihrZXlOYW1lKTtcbiAgICAgIGlmIChpbmRleCA+IC0xKSB7IGtleUNvZGVzLnB1c2goa2V5Q29kZXwwKTsgfVxuICAgIH1cbiAgICByZXR1cm4ga2V5Q29kZXM7XG4gIH07XG5cbiAgZ2V0S2V5TmFtZXMoa2V5Q29kZSkge1xuICAgIHJldHVybiB0aGlzLl9rZXlNYXBba2V5Q29kZV0gfHwgW107XG4gIH07XG5cbiAgc2V0S2lsbEtleShrZXlDb2RlKSB7XG4gICAgaWYgKHR5cGVvZiBrZXlDb2RlID09PSAnc3RyaW5nJykge1xuICAgICAgY29uc3Qga2V5Q29kZXMgPSB0aGlzLmdldEtleUNvZGVzKGtleUNvZGUpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlDb2Rlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICB0aGlzLnNldEtpbGxLZXkoa2V5Q29kZXNbaV0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX2tpbGxLZXlDb2Rlcy5wdXNoKGtleUNvZGUpO1xuICB9O1xuXG4gIHByZXNzS2V5KGtleUNvZGUpIHtcbiAgICBpZiAodHlwZW9mIGtleUNvZGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBjb25zdCBrZXlDb2RlcyA9IHRoaXMuZ2V0S2V5Q29kZXMoa2V5Q29kZSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleUNvZGVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHRoaXMucHJlc3NLZXkoa2V5Q29kZXNbaV0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuYWN0aXZlVGFyZ2V0S2V5cy5sZW5ndGggPSAwO1xuICAgIGNvbnN0IGtleU5hbWVzID0gdGhpcy5nZXRLZXlOYW1lcyhrZXlDb2RlKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleU5hbWVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICB0aGlzLmFjdGl2ZVRhcmdldEtleXMucHVzaChrZXlOYW1lc1tpXSk7XG4gICAgICBpZiAodGhpcy5wcmVzc2VkS2V5cy5pbmRleE9mKGtleU5hbWVzW2ldKSA9PT0gLTEpIHtcbiAgICAgICAgdGhpcy5wcmVzc2VkS2V5cy5wdXNoKGtleU5hbWVzW2ldKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9hcHBseU1hY3JvcygpO1xuICB9O1xuXG4gIHJlbGVhc2VLZXkoa2V5Q29kZSkge1xuICAgIGlmICh0eXBlb2Yga2V5Q29kZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnN0IGtleUNvZGVzID0gdGhpcy5nZXRLZXlDb2RlcyhrZXlDb2RlKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwga2V5Q29kZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgdGhpcy5yZWxlYXNlS2V5KGtleUNvZGVzW2ldKTtcbiAgICAgIH1cblxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBrZXlOYW1lcyAgICAgICAgID0gdGhpcy5nZXRLZXlOYW1lcyhrZXlDb2RlKTtcbiAgICAgIGNvbnN0IGtpbGxLZXlDb2RlSW5kZXggPSB0aGlzLl9raWxsS2V5Q29kZXMuaW5kZXhPZihrZXlDb2RlKTtcblxuICAgICAgaWYgKGtpbGxLZXlDb2RlSW5kZXggIT09IC0xKSB7XG4gICAgICAgIHRoaXMucHJlc3NlZEtleXMubGVuZ3RoID0gMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwga2V5TmFtZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMucHJlc3NlZEtleXMuaW5kZXhPZihrZXlOYW1lc1tpXSk7XG4gICAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIHRoaXMucHJlc3NlZEtleXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5hY3RpdmVUYXJnZXRLZXlzLmxlbmd0aCA9IDA7XG4gICAgICB0aGlzLl9jbGVhck1hY3JvcygpO1xuICAgIH1cbiAgfTtcblxuICBfYXBwbHlNYWNyb3MoKSB7XG4gICAgY29uc3QgbWFjcm9zID0gdGhpcy5fbWFjcm9zLnNsaWNlKDApO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWFjcm9zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICBjb25zdCBtYWNybyA9IG1hY3Jvc1tpXTtcbiAgICAgIGlmIChtYWNyby5rZXlDb21iby5jaGVjayh0aGlzLnByZXNzZWRLZXlzKSkge1xuICAgICAgICBpZiAobWFjcm8uaGFuZGxlcikge1xuICAgICAgICAgIG1hY3JvLmtleU5hbWVzID0gbWFjcm8uaGFuZGxlcih0aGlzLnByZXNzZWRLZXlzKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG1hY3JvLmtleU5hbWVzLmxlbmd0aDsgaiArPSAxKSB7XG4gICAgICAgICAgaWYgKHRoaXMucHJlc3NlZEtleXMuaW5kZXhPZihtYWNyby5rZXlOYW1lc1tqXSkgPT09IC0xKSB7XG4gICAgICAgICAgICB0aGlzLnByZXNzZWRLZXlzLnB1c2gobWFjcm8ua2V5TmFtZXNbal0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hcHBsaWVkTWFjcm9zLnB1c2gobWFjcm8pO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBfY2xlYXJNYWNyb3MoKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9hcHBsaWVkTWFjcm9zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICBjb25zdCBtYWNybyA9IHRoaXMuX2FwcGxpZWRNYWNyb3NbaV07XG4gICAgICBpZiAoIW1hY3JvLmtleUNvbWJvLmNoZWNrKHRoaXMucHJlc3NlZEtleXMpKSB7XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgbWFjcm8ua2V5TmFtZXMubGVuZ3RoOyBqICs9IDEpIHtcbiAgICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMucHJlc3NlZEtleXMuaW5kZXhPZihtYWNyby5rZXlOYW1lc1tqXSk7XG4gICAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIHRoaXMucHJlc3NlZEtleXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1hY3JvLmhhbmRsZXIpIHtcbiAgICAgICAgICBtYWNyby5rZXlOYW1lcyA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fYXBwbGllZE1hY3Jvcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGkgLT0gMTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IExvY2FsZSB9IGZyb20gJy4vbG9jYWxlJztcbmltcG9ydCB7IEtleUNvbWJvIH0gZnJvbSAnLi9rZXktY29tYm8nO1xuXG5cbmV4cG9ydCBjbGFzcyBLZXlib2FyZCB7XG4gIGNvbnN0cnVjdG9yKHRhcmdldFdpbmRvdywgdGFyZ2V0RWxlbWVudCwgdGFyZ2V0UGxhdGZvcm0sIHRhcmdldFVzZXJBZ2VudCkge1xuICAgIHRoaXMuX2xvY2FsZSAgICAgICAgICAgICAgID0gbnVsbDtcbiAgICB0aGlzLl9jdXJyZW50Q29udGV4dCAgICAgICA9ICcnO1xuICAgIHRoaXMuX2NvbnRleHRzICAgICAgICAgICAgID0ge307XG4gICAgdGhpcy5fbGlzdGVuZXJzICAgICAgICAgICAgPSBbXTtcbiAgICB0aGlzLl9hcHBsaWVkTGlzdGVuZXJzICAgICA9IFtdO1xuICAgIHRoaXMuX2xvY2FsZXMgICAgICAgICAgICAgID0ge307XG4gICAgdGhpcy5fdGFyZ2V0RWxlbWVudCAgICAgICAgPSBudWxsO1xuICAgIHRoaXMuX3RhcmdldFdpbmRvdyAgICAgICAgID0gbnVsbDtcbiAgICB0aGlzLl90YXJnZXRQbGF0Zm9ybSAgICAgICA9ICcnO1xuICAgIHRoaXMuX3RhcmdldFVzZXJBZ2VudCAgICAgID0gJyc7XG4gICAgdGhpcy5faXNNb2Rlcm5Ccm93c2VyICAgICAgPSBmYWxzZTtcbiAgICB0aGlzLl90YXJnZXRLZXlEb3duQmluZGluZyA9IG51bGw7XG4gICAgdGhpcy5fdGFyZ2V0S2V5VXBCaW5kaW5nICAgPSBudWxsO1xuICAgIHRoaXMuX3RhcmdldFJlc2V0QmluZGluZyAgID0gbnVsbDtcbiAgICB0aGlzLl9wYXVzZWQgICAgICAgICAgICAgICA9IGZhbHNlO1xuXG4gICAgdGhpcy5fY29udGV4dHMuZ2xvYmFsID0ge1xuICAgICAgbGlzdGVuZXJzOiB0aGlzLl9saXN0ZW5lcnMsXG4gICAgICB0YXJnZXRXaW5kb3csXG4gICAgICB0YXJnZXRFbGVtZW50LFxuICAgICAgdGFyZ2V0UGxhdGZvcm0sXG4gICAgICB0YXJnZXRVc2VyQWdlbnRcbiAgICB9O1xuXG4gICAgdGhpcy5zZXRDb250ZXh0KCdnbG9iYWwnKTtcbiAgfVxuXG4gIHNldExvY2FsZShsb2NhbGVOYW1lLCBsb2NhbGVCdWlsZGVyKSB7XG4gICAgbGV0IGxvY2FsZSA9IG51bGw7XG4gICAgaWYgKHR5cGVvZiBsb2NhbGVOYW1lID09PSAnc3RyaW5nJykge1xuXG4gICAgICBpZiAobG9jYWxlQnVpbGRlcikge1xuICAgICAgICBsb2NhbGUgPSBuZXcgTG9jYWxlKGxvY2FsZU5hbWUpO1xuICAgICAgICBsb2NhbGVCdWlsZGVyKGxvY2FsZSwgdGhpcy5fdGFyZ2V0UGxhdGZvcm0sIHRoaXMuX3RhcmdldFVzZXJBZ2VudCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsb2NhbGUgPSB0aGlzLl9sb2NhbGVzW2xvY2FsZU5hbWVdIHx8IG51bGw7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGxvY2FsZSAgICAgPSBsb2NhbGVOYW1lO1xuICAgICAgbG9jYWxlTmFtZSA9IGxvY2FsZS5fbG9jYWxlTmFtZTtcbiAgICB9XG5cbiAgICB0aGlzLl9sb2NhbGUgICAgICAgICAgICAgID0gbG9jYWxlO1xuICAgIHRoaXMuX2xvY2FsZXNbbG9jYWxlTmFtZV0gPSBsb2NhbGU7XG4gICAgaWYgKGxvY2FsZSkge1xuICAgICAgdGhpcy5fbG9jYWxlLnByZXNzZWRLZXlzID0gbG9jYWxlLnByZXNzZWRLZXlzO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0TG9jYWxlKGxvY2FsTmFtZSkge1xuICAgIGxvY2FsTmFtZSB8fCAobG9jYWxOYW1lID0gdGhpcy5fbG9jYWxlLmxvY2FsZU5hbWUpO1xuICAgIHJldHVybiB0aGlzLl9sb2NhbGVzW2xvY2FsTmFtZV0gfHwgbnVsbDtcbiAgfVxuXG4gIGJpbmQoa2V5Q29tYm9TdHIsIHByZXNzSGFuZGxlciwgcmVsZWFzZUhhbmRsZXIsIHByZXZlbnRSZXBlYXRCeURlZmF1bHQpIHtcbiAgICBpZiAoa2V5Q29tYm9TdHIgPT09IG51bGwgfHwgdHlwZW9mIGtleUNvbWJvU3RyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBwcmV2ZW50UmVwZWF0QnlEZWZhdWx0ID0gcmVsZWFzZUhhbmRsZXI7XG4gICAgICByZWxlYXNlSGFuZGxlciAgICAgICAgID0gcHJlc3NIYW5kbGVyO1xuICAgICAgcHJlc3NIYW5kbGVyICAgICAgICAgICA9IGtleUNvbWJvU3RyO1xuICAgICAga2V5Q29tYm9TdHIgICAgICAgICAgICA9IG51bGw7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAga2V5Q29tYm9TdHIgJiZcbiAgICAgIHR5cGVvZiBrZXlDb21ib1N0ciA9PT0gJ29iamVjdCcgJiZcbiAgICAgIHR5cGVvZiBrZXlDb21ib1N0ci5sZW5ndGggPT09ICdudW1iZXInXG4gICAgKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleUNvbWJvU3RyLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIHRoaXMuYmluZChrZXlDb21ib1N0cltpXSwgcHJlc3NIYW5kbGVyLCByZWxlYXNlSGFuZGxlcik7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICB0aGlzLl9saXN0ZW5lcnMucHVzaCh7XG4gICAgICBrZXlDb21ibyAgICAgICAgICAgICAgOiBrZXlDb21ib1N0ciA/IG5ldyBLZXlDb21ibyhrZXlDb21ib1N0cikgOiBudWxsLFxuICAgICAgcHJlc3NIYW5kbGVyICAgICAgICAgIDogcHJlc3NIYW5kbGVyICAgICAgICAgICB8fCBudWxsLFxuICAgICAgcmVsZWFzZUhhbmRsZXIgICAgICAgIDogcmVsZWFzZUhhbmRsZXIgICAgICAgICB8fCBudWxsLFxuICAgICAgcHJldmVudFJlcGVhdCAgICAgICAgIDogcHJldmVudFJlcGVhdEJ5RGVmYXVsdCB8fCBmYWxzZSxcbiAgICAgIHByZXZlbnRSZXBlYXRCeURlZmF1bHQ6IHByZXZlbnRSZXBlYXRCeURlZmF1bHQgfHwgZmFsc2UsXG4gICAgICBleGVjdXRpbmdIYW5kbGVyICAgICAgOiBmYWxzZVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBhZGRMaXN0ZW5lcihrZXlDb21ib1N0ciwgcHJlc3NIYW5kbGVyLCByZWxlYXNlSGFuZGxlciwgcHJldmVudFJlcGVhdEJ5RGVmYXVsdCkge1xuICAgIHJldHVybiB0aGlzLmJpbmQoa2V5Q29tYm9TdHIsIHByZXNzSGFuZGxlciwgcmVsZWFzZUhhbmRsZXIsIHByZXZlbnRSZXBlYXRCeURlZmF1bHQpO1xuICB9XG5cbiAgb24oa2V5Q29tYm9TdHIsIHByZXNzSGFuZGxlciwgcmVsZWFzZUhhbmRsZXIsIHByZXZlbnRSZXBlYXRCeURlZmF1bHQpIHtcbiAgICByZXR1cm4gdGhpcy5iaW5kKGtleUNvbWJvU3RyLCBwcmVzc0hhbmRsZXIsIHJlbGVhc2VIYW5kbGVyLCBwcmV2ZW50UmVwZWF0QnlEZWZhdWx0KTtcbiAgfVxuXG4gIGJpbmRQcmVzcyhrZXlDb21ib1N0ciwgcHJlc3NIYW5kbGVyLCBwcmV2ZW50UmVwZWF0QnlEZWZhdWx0KSB7XG4gICAgcmV0dXJuIHRoaXMuYmluZChrZXlDb21ib1N0ciwgcHJlc3NIYW5kbGVyLCBudWxsLCBwcmV2ZW50UmVwZWF0QnlEZWZhdWx0KTtcbiAgfVxuXG4gIGJpbmRSZWxlYXNlKGtleUNvbWJvU3RyLCByZWxlYXNlSGFuZGxlcikge1xuICAgIHJldHVybiB0aGlzLmJpbmQoa2V5Q29tYm9TdHIsIG51bGwsIHJlbGVhc2VIYW5kbGVyLCBwcmV2ZW50UmVwZWF0QnlEZWZhdWx0KTtcbiAgfVxuXG4gIHVuYmluZChrZXlDb21ib1N0ciwgcHJlc3NIYW5kbGVyLCByZWxlYXNlSGFuZGxlcikge1xuICAgIGlmIChrZXlDb21ib1N0ciA9PT0gbnVsbCB8fCB0eXBlb2Yga2V5Q29tYm9TdHIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJlbGVhc2VIYW5kbGVyID0gcHJlc3NIYW5kbGVyO1xuICAgICAgcHJlc3NIYW5kbGVyICAgPSBrZXlDb21ib1N0cjtcbiAgICAgIGtleUNvbWJvU3RyID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICBrZXlDb21ib1N0ciAmJlxuICAgICAgdHlwZW9mIGtleUNvbWJvU3RyID09PSAnb2JqZWN0JyAmJlxuICAgICAgdHlwZW9mIGtleUNvbWJvU3RyLmxlbmd0aCA9PT0gJ251bWJlcidcbiAgICApIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwga2V5Q29tYm9TdHIubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgdGhpcy51bmJpbmQoa2V5Q29tYm9TdHJbaV0sIHByZXNzSGFuZGxlciwgcmVsZWFzZUhhbmRsZXIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9saXN0ZW5lcnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIGNvbnN0IGxpc3RlbmVyID0gdGhpcy5fbGlzdGVuZXJzW2ldO1xuXG4gICAgICBjb25zdCBjb21ib01hdGNoZXMgICAgICAgICAgPSAha2V5Q29tYm9TdHIgJiYgIWxpc3RlbmVyLmtleUNvbWJvIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXIua2V5Q29tYm8gJiYgbGlzdGVuZXIua2V5Q29tYm8uaXNFcXVhbChrZXlDb21ib1N0cik7XG4gICAgICBjb25zdCBwcmVzc0hhbmRsZXJNYXRjaGVzICAgPSAhcHJlc3NIYW5kbGVyICYmICFyZWxlYXNlSGFuZGxlciB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICFwcmVzc0hhbmRsZXIgJiYgIWxpc3RlbmVyLnByZXNzSGFuZGxlciB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZXNzSGFuZGxlciA9PT0gbGlzdGVuZXIucHJlc3NIYW5kbGVyO1xuICAgICAgY29uc3QgcmVsZWFzZUhhbmRsZXJNYXRjaGVzID0gIXByZXNzSGFuZGxlciAmJiAhcmVsZWFzZUhhbmRsZXIgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAhcmVsZWFzZUhhbmRsZXIgJiYgIWxpc3RlbmVyLnJlbGVhc2VIYW5kbGVyIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVsZWFzZUhhbmRsZXIgPT09IGxpc3RlbmVyLnJlbGVhc2VIYW5kbGVyO1xuXG4gICAgICBpZiAoY29tYm9NYXRjaGVzICYmIHByZXNzSGFuZGxlck1hdGNoZXMgJiYgcmVsZWFzZUhhbmRsZXJNYXRjaGVzKSB7XG4gICAgICAgIHRoaXMuX2xpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGkgLT0gMTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHJlbW92ZUxpc3RlbmVyKGtleUNvbWJvU3RyLCBwcmVzc0hhbmRsZXIsIHJlbGVhc2VIYW5kbGVyKSB7XG4gICAgcmV0dXJuIHRoaXMudW5iaW5kKGtleUNvbWJvU3RyLCBwcmVzc0hhbmRsZXIsIHJlbGVhc2VIYW5kbGVyKTtcbiAgfVxuXG4gIG9mZihrZXlDb21ib1N0ciwgcHJlc3NIYW5kbGVyLCByZWxlYXNlSGFuZGxlcikge1xuICAgIHJldHVybiB0aGlzLnVuYmluZChrZXlDb21ib1N0ciwgcHJlc3NIYW5kbGVyLCByZWxlYXNlSGFuZGxlcik7XG4gIH1cblxuICBzZXRDb250ZXh0KGNvbnRleHROYW1lKSB7XG4gICAgaWYodGhpcy5fbG9jYWxlKSB7IHRoaXMucmVsZWFzZUFsbEtleXMoKTsgfVxuXG4gICAgaWYgKCF0aGlzLl9jb250ZXh0c1tjb250ZXh0TmFtZV0pIHtcbiAgICAgIGNvbnN0IGdsb2JhbENvbnRleHQgPSB0aGlzLl9jb250ZXh0cy5nbG9iYWw7XG4gICAgICB0aGlzLl9jb250ZXh0c1tjb250ZXh0TmFtZV0gPSB7XG4gICAgICAgIGxpc3RlbmVycyAgICAgIDogW10sXG4gICAgICAgIHRhcmdldFdpbmRvdyAgIDogZ2xvYmFsQ29udGV4dC50YXJnZXRXaW5kb3csXG4gICAgICAgIHRhcmdldEVsZW1lbnQgIDogZ2xvYmFsQ29udGV4dC50YXJnZXRFbGVtZW50LFxuICAgICAgICB0YXJnZXRQbGF0Zm9ybSA6IGdsb2JhbENvbnRleHQudGFyZ2V0UGxhdGZvcm0sXG4gICAgICAgIHRhcmdldFVzZXJBZ2VudDogZ2xvYmFsQ29udGV4dC50YXJnZXRVc2VyQWdlbnRcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3QgY29udGV4dCAgICAgICAgPSB0aGlzLl9jb250ZXh0c1tjb250ZXh0TmFtZV07XG4gICAgdGhpcy5fY3VycmVudENvbnRleHQgPSBjb250ZXh0TmFtZTtcbiAgICB0aGlzLl9saXN0ZW5lcnMgICAgICA9IGNvbnRleHQubGlzdGVuZXJzO1xuXG4gICAgdGhpcy5zdG9wKCk7XG4gICAgdGhpcy53YXRjaChcbiAgICAgIGNvbnRleHQudGFyZ2V0V2luZG93LFxuICAgICAgY29udGV4dC50YXJnZXRFbGVtZW50LFxuICAgICAgY29udGV4dC50YXJnZXRQbGF0Zm9ybSxcbiAgICAgIGNvbnRleHQudGFyZ2V0VXNlckFnZW50XG4gICAgKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0Q29udGV4dCgpIHtcbiAgICByZXR1cm4gdGhpcy5fY3VycmVudENvbnRleHQ7XG4gIH1cblxuICB3aXRoQ29udGV4dChjb250ZXh0TmFtZSwgY2FsbGJhY2spIHtcbiAgICBjb25zdCBwcmV2aW91c0NvbnRleHROYW1lID0gdGhpcy5nZXRDb250ZXh0KCk7XG4gICAgdGhpcy5zZXRDb250ZXh0KGNvbnRleHROYW1lKTtcblxuICAgIGNhbGxiYWNrKCk7XG5cbiAgICB0aGlzLnNldENvbnRleHQocHJldmlvdXNDb250ZXh0TmFtZSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHdhdGNoKHRhcmdldFdpbmRvdywgdGFyZ2V0RWxlbWVudCwgdGFyZ2V0UGxhdGZvcm0sIHRhcmdldFVzZXJBZ2VudCkge1xuICAgIHRoaXMuc3RvcCgpO1xuXG4gICAgY29uc3Qgd2luID0gdHlwZW9mIGdsb2JhbFRoaXMgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsVGhpcyA6XG4gICAgICAgICAgICAgICAgdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOlxuICAgICAgICAgICAgICAgIHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDpcbiAgICAgICAgICAgICAgICB7fTtcblxuICAgIGlmICghdGFyZ2V0V2luZG93KSB7XG4gICAgICBpZiAoIXdpbi5hZGRFdmVudExpc3RlbmVyICYmICF3aW4uYXR0YWNoRXZlbnQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgZmluZCB3aW5kb3cgZnVuY3Rpb25zIGFkZEV2ZW50TGlzdGVuZXIgb3IgYXR0YWNoRXZlbnQuJyk7XG4gICAgICB9XG4gICAgICB0YXJnZXRXaW5kb3cgPSB3aW47XG4gICAgfVxuXG4gICAgLy8gSGFuZGxlIGVsZW1lbnQgYmluZGluZ3Mgd2hlcmUgYSB0YXJnZXQgd2luZG93IGlzIG5vdCBwYXNzZWRcbiAgICBpZiAodHlwZW9mIHRhcmdldFdpbmRvdy5ub2RlVHlwZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIHRhcmdldFVzZXJBZ2VudCA9IHRhcmdldFBsYXRmb3JtO1xuICAgICAgdGFyZ2V0UGxhdGZvcm0gID0gdGFyZ2V0RWxlbWVudDtcbiAgICAgIHRhcmdldEVsZW1lbnQgICA9IHRhcmdldFdpbmRvdztcbiAgICAgIHRhcmdldFdpbmRvdyAgICA9IHdpbjtcbiAgICB9XG5cbiAgICBpZiAoIXRhcmdldFdpbmRvdy5hZGRFdmVudExpc3RlbmVyICYmICF0YXJnZXRXaW5kb3cuYXR0YWNoRXZlbnQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGZpbmQgYWRkRXZlbnRMaXN0ZW5lciBvciBhdHRhY2hFdmVudCBtZXRob2RzIG9uIHRhcmdldFdpbmRvdy4nKTtcbiAgICB9XG5cbiAgICB0aGlzLl9pc01vZGVybkJyb3dzZXIgPSAhIXRhcmdldFdpbmRvdy5hZGRFdmVudExpc3RlbmVyO1xuXG4gICAgY29uc3QgdXNlckFnZW50ID0gdGFyZ2V0V2luZG93Lm5hdmlnYXRvciAmJiB0YXJnZXRXaW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudCB8fCAnJztcbiAgICBjb25zdCBwbGF0Zm9ybSAgPSB0YXJnZXRXaW5kb3cubmF2aWdhdG9yICYmIHRhcmdldFdpbmRvdy5uYXZpZ2F0b3IucGxhdGZvcm0gIHx8ICcnO1xuXG4gICAgdGFyZ2V0RWxlbWVudCAgICYmIHRhcmdldEVsZW1lbnQgICAhPT0gbnVsbCB8fCAodGFyZ2V0RWxlbWVudCAgID0gdGFyZ2V0V2luZG93LmRvY3VtZW50KTtcbiAgICB0YXJnZXRQbGF0Zm9ybSAgJiYgdGFyZ2V0UGxhdGZvcm0gICE9PSBudWxsIHx8ICh0YXJnZXRQbGF0Zm9ybSAgPSBwbGF0Zm9ybSk7XG4gICAgdGFyZ2V0VXNlckFnZW50ICYmIHRhcmdldFVzZXJBZ2VudCAhPT0gbnVsbCB8fCAodGFyZ2V0VXNlckFnZW50ID0gdXNlckFnZW50KTtcblxuICAgIHRoaXMuX3RhcmdldEtleURvd25CaW5kaW5nID0gKGV2ZW50KSA9PiB7XG4gICAgICB0aGlzLnByZXNzS2V5KGV2ZW50LmtleUNvZGUsIGV2ZW50KTtcbiAgICAgIHRoaXMuX2hhbmRsZUNvbW1hbmRCdWcoZXZlbnQsIHBsYXRmb3JtKTtcbiAgICB9O1xuICAgIHRoaXMuX3RhcmdldEtleVVwQmluZGluZyA9IChldmVudCkgPT4ge1xuICAgICAgdGhpcy5yZWxlYXNlS2V5KGV2ZW50LmtleUNvZGUsIGV2ZW50KTtcbiAgICB9O1xuICAgIHRoaXMuX3RhcmdldFJlc2V0QmluZGluZyA9IChldmVudCkgPT4ge1xuICAgICAgdGhpcy5yZWxlYXNlQWxsS2V5cyhldmVudCk7XG4gICAgfTtcblxuICAgIHRoaXMuX2JpbmRFdmVudCh0YXJnZXRFbGVtZW50LCAna2V5ZG93bicsIHRoaXMuX3RhcmdldEtleURvd25CaW5kaW5nKTtcbiAgICB0aGlzLl9iaW5kRXZlbnQodGFyZ2V0RWxlbWVudCwgJ2tleXVwJywgICB0aGlzLl90YXJnZXRLZXlVcEJpbmRpbmcpO1xuICAgIHRoaXMuX2JpbmRFdmVudCh0YXJnZXRXaW5kb3csICAnZm9jdXMnLCAgIHRoaXMuX3RhcmdldFJlc2V0QmluZGluZyk7XG4gICAgdGhpcy5fYmluZEV2ZW50KHRhcmdldFdpbmRvdywgICdibHVyJywgICAgdGhpcy5fdGFyZ2V0UmVzZXRCaW5kaW5nKTtcblxuICAgIHRoaXMuX3RhcmdldEVsZW1lbnQgICA9IHRhcmdldEVsZW1lbnQ7XG4gICAgdGhpcy5fdGFyZ2V0V2luZG93ICAgID0gdGFyZ2V0V2luZG93O1xuICAgIHRoaXMuX3RhcmdldFBsYXRmb3JtICA9IHRhcmdldFBsYXRmb3JtO1xuICAgIHRoaXMuX3RhcmdldFVzZXJBZ2VudCA9IHRhcmdldFVzZXJBZ2VudDtcblxuICAgIGNvbnN0IGN1cnJlbnRDb250ZXh0ICAgICAgICAgICA9IHRoaXMuX2NvbnRleHRzW3RoaXMuX2N1cnJlbnRDb250ZXh0XTtcbiAgICBjdXJyZW50Q29udGV4dC50YXJnZXRXaW5kb3cgICAgPSB0aGlzLl90YXJnZXRXaW5kb3c7XG4gICAgY3VycmVudENvbnRleHQudGFyZ2V0RWxlbWVudCAgID0gdGhpcy5fdGFyZ2V0RWxlbWVudDtcbiAgICBjdXJyZW50Q29udGV4dC50YXJnZXRQbGF0Zm9ybSAgPSB0aGlzLl90YXJnZXRQbGF0Zm9ybTtcbiAgICBjdXJyZW50Q29udGV4dC50YXJnZXRVc2VyQWdlbnQgPSB0aGlzLl90YXJnZXRVc2VyQWdlbnQ7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHN0b3AoKSB7XG4gICAgaWYgKCF0aGlzLl90YXJnZXRFbGVtZW50IHx8ICF0aGlzLl90YXJnZXRXaW5kb3cpIHsgcmV0dXJuOyB9XG5cbiAgICB0aGlzLl91bmJpbmRFdmVudCh0aGlzLl90YXJnZXRFbGVtZW50LCAna2V5ZG93bicsIHRoaXMuX3RhcmdldEtleURvd25CaW5kaW5nKTtcbiAgICB0aGlzLl91bmJpbmRFdmVudCh0aGlzLl90YXJnZXRFbGVtZW50LCAna2V5dXAnLCAgIHRoaXMuX3RhcmdldEtleVVwQmluZGluZyk7XG4gICAgdGhpcy5fdW5iaW5kRXZlbnQodGhpcy5fdGFyZ2V0V2luZG93LCAgJ2ZvY3VzJywgICB0aGlzLl90YXJnZXRSZXNldEJpbmRpbmcpO1xuICAgIHRoaXMuX3VuYmluZEV2ZW50KHRoaXMuX3RhcmdldFdpbmRvdywgICdibHVyJywgICAgdGhpcy5fdGFyZ2V0UmVzZXRCaW5kaW5nKTtcblxuICAgIHRoaXMuX3RhcmdldFdpbmRvdyAgPSBudWxsO1xuICAgIHRoaXMuX3RhcmdldEVsZW1lbnQgPSBudWxsO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBwcmVzc0tleShrZXlDb2RlLCBldmVudCkge1xuICAgIGlmICh0aGlzLl9wYXVzZWQpIHsgcmV0dXJuIHRoaXM7IH1cbiAgICBpZiAoIXRoaXMuX2xvY2FsZSkgeyB0aHJvdyBuZXcgRXJyb3IoJ0xvY2FsZSBub3Qgc2V0Jyk7IH1cblxuICAgIHRoaXMuX2xvY2FsZS5wcmVzc0tleShrZXlDb2RlKTtcbiAgICB0aGlzLl9hcHBseUJpbmRpbmdzKGV2ZW50KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcmVsZWFzZUtleShrZXlDb2RlLCBldmVudCkge1xuICAgIGlmICh0aGlzLl9wYXVzZWQpIHsgcmV0dXJuIHRoaXM7IH1cbiAgICBpZiAoIXRoaXMuX2xvY2FsZSkgeyB0aHJvdyBuZXcgRXJyb3IoJ0xvY2FsZSBub3Qgc2V0Jyk7IH1cblxuICAgIHRoaXMuX2xvY2FsZS5yZWxlYXNlS2V5KGtleUNvZGUpO1xuICAgIHRoaXMuX2NsZWFyQmluZGluZ3MoZXZlbnQpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZWxlYXNlQWxsS2V5cyhldmVudCkge1xuICAgIGlmICh0aGlzLl9wYXVzZWQpIHsgcmV0dXJuIHRoaXM7IH1cbiAgICBpZiAoIXRoaXMuX2xvY2FsZSkgeyB0aHJvdyBuZXcgRXJyb3IoJ0xvY2FsZSBub3Qgc2V0Jyk7IH1cblxuICAgIHRoaXMuX2xvY2FsZS5wcmVzc2VkS2V5cy5sZW5ndGggPSAwO1xuICAgIHRoaXMuX2NsZWFyQmluZGluZ3MoZXZlbnQpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBwYXVzZSgpIHtcbiAgICBpZiAodGhpcy5fcGF1c2VkKSB7IHJldHVybiB0aGlzOyB9XG4gICAgaWYgKHRoaXMuX2xvY2FsZSkgeyB0aGlzLnJlbGVhc2VBbGxLZXlzKCk7IH1cbiAgICB0aGlzLl9wYXVzZWQgPSB0cnVlO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZXN1bWUoKSB7XG4gICAgdGhpcy5fcGF1c2VkID0gZmFsc2U7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHJlc2V0KCkge1xuICAgIHRoaXMucmVsZWFzZUFsbEtleXMoKTtcbiAgICB0aGlzLl9saXN0ZW5lcnMubGVuZ3RoID0gMDtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgX2JpbmRFdmVudCh0YXJnZXRFbGVtZW50LCBldmVudE5hbWUsIGhhbmRsZXIpIHtcbiAgICByZXR1cm4gdGhpcy5faXNNb2Rlcm5Ccm93c2VyID9cbiAgICAgIHRhcmdldEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGhhbmRsZXIsIGZhbHNlKSA6XG4gICAgICB0YXJnZXRFbGVtZW50LmF0dGFjaEV2ZW50KCdvbicgKyBldmVudE5hbWUsIGhhbmRsZXIpO1xuICB9XG5cbiAgX3VuYmluZEV2ZW50KHRhcmdldEVsZW1lbnQsIGV2ZW50TmFtZSwgaGFuZGxlcikge1xuICAgIHJldHVybiB0aGlzLl9pc01vZGVybkJyb3dzZXIgP1xuICAgICAgdGFyZ2V0RWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgaGFuZGxlciwgZmFsc2UpIDpcbiAgICAgIHRhcmdldEVsZW1lbnQuZGV0YWNoRXZlbnQoJ29uJyArIGV2ZW50TmFtZSwgaGFuZGxlcik7XG4gIH1cblxuICBfZ2V0R3JvdXBlZExpc3RlbmVycygpIHtcbiAgICBjb25zdCBsaXN0ZW5lckdyb3VwcyAgID0gW107XG4gICAgY29uc3QgbGlzdGVuZXJHcm91cE1hcCA9IFtdO1xuXG4gICAgbGV0IGxpc3RlbmVycyA9IHRoaXMuX2xpc3RlbmVycztcbiAgICBpZiAodGhpcy5fY3VycmVudENvbnRleHQgIT09ICdnbG9iYWwnKSB7XG4gICAgICBsaXN0ZW5lcnMgPSBbLi4ubGlzdGVuZXJzLCAuLi50aGlzLl9jb250ZXh0cy5nbG9iYWwubGlzdGVuZXJzXTtcbiAgICB9XG5cbiAgICBsaXN0ZW5lcnMuc29ydChcbiAgICAgIChhLCBiKSA9PlxuICAgICAgICAoYi5rZXlDb21ibyA/IGIua2V5Q29tYm8ua2V5TmFtZXMubGVuZ3RoIDogMCkgLVxuICAgICAgICAoYS5rZXlDb21ibyA/IGEua2V5Q29tYm8ua2V5TmFtZXMubGVuZ3RoIDogMClcbiAgICApLmZvckVhY2goKGwpID0+IHtcbiAgICAgIGxldCBtYXBJbmRleCA9IC0xO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0ZW5lckdyb3VwTWFwLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmIChsaXN0ZW5lckdyb3VwTWFwW2ldID09PSBudWxsICYmIGwua2V5Q29tYm8gPT09IG51bGwgfHxcbiAgICAgICAgICAgIGxpc3RlbmVyR3JvdXBNYXBbaV0gIT09IG51bGwgJiYgbGlzdGVuZXJHcm91cE1hcFtpXS5pc0VxdWFsKGwua2V5Q29tYm8pKSB7XG4gICAgICAgICAgbWFwSW5kZXggPSBpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAobWFwSW5kZXggPT09IC0xKSB7XG4gICAgICAgIG1hcEluZGV4ID0gbGlzdGVuZXJHcm91cE1hcC5sZW5ndGg7XG4gICAgICAgIGxpc3RlbmVyR3JvdXBNYXAucHVzaChsLmtleUNvbWJvKTtcbiAgICAgIH1cbiAgICAgIGlmICghbGlzdGVuZXJHcm91cHNbbWFwSW5kZXhdKSB7XG4gICAgICAgIGxpc3RlbmVyR3JvdXBzW21hcEluZGV4XSA9IFtdO1xuICAgICAgfVxuICAgICAgbGlzdGVuZXJHcm91cHNbbWFwSW5kZXhdLnB1c2gobCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbGlzdGVuZXJHcm91cHM7XG4gIH1cblxuICBfYXBwbHlCaW5kaW5ncyhldmVudCkge1xuICAgIGxldCBwcmV2ZW50UmVwZWF0ID0gZmFsc2U7XG5cbiAgICBldmVudCB8fCAoZXZlbnQgPSB7fSk7XG4gICAgZXZlbnQucHJldmVudFJlcGVhdCA9ICgpID0+IHsgcHJldmVudFJlcGVhdCA9IHRydWU7IH07XG4gICAgZXZlbnQucHJlc3NlZEtleXMgICA9IHRoaXMuX2xvY2FsZS5wcmVzc2VkS2V5cy5zbGljZSgwKTtcblxuICAgIGNvbnN0IGFjdGl2ZVRhcmdldEtleXMgPSB0aGlzLl9sb2NhbGUuYWN0aXZlVGFyZ2V0S2V5cztcbiAgICBjb25zdCBwcmVzc2VkS2V5cyAgICAgID0gdGhpcy5fbG9jYWxlLnByZXNzZWRLZXlzLnNsaWNlKDApO1xuICAgIGNvbnN0IGxpc3RlbmVyR3JvdXBzICAgPSB0aGlzLl9nZXRHcm91cGVkTGlzdGVuZXJzKCk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3RlbmVyR3JvdXBzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICBjb25zdCBsaXN0ZW5lcnMgPSBsaXN0ZW5lckdyb3Vwc1tpXTtcbiAgICAgIGNvbnN0IGtleUNvbWJvICA9IGxpc3RlbmVyc1swXS5rZXlDb21ibztcblxuICAgICAgaWYgKFxuICAgICAgICBrZXlDb21ibyA9PT0gbnVsbCB8fFxuICAgICAgICBrZXlDb21iby5jaGVjayhwcmVzc2VkS2V5cykgJiZcbiAgICAgICAgYWN0aXZlVGFyZ2V0S2V5cy5zb21lKGsgPT4ga2V5Q29tYm8ua2V5TmFtZXMuaW5jbHVkZXMoaykpXG4gICAgICApIHtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBsaXN0ZW5lcnMubGVuZ3RoOyBqICs9IDEpIHtcbiAgICAgICAgICBsZXQgbGlzdGVuZXIgPSBsaXN0ZW5lcnNbal07XG5cbiAgICAgICAgICBpZiAoIWxpc3RlbmVyLmV4ZWN1dGluZ0hhbmRsZXIgJiYgbGlzdGVuZXIucHJlc3NIYW5kbGVyICYmICFsaXN0ZW5lci5wcmV2ZW50UmVwZWF0KSB7XG4gICAgICAgICAgICBsaXN0ZW5lci5leGVjdXRpbmdIYW5kbGVyID0gdHJ1ZTtcbiAgICAgICAgICAgIGxpc3RlbmVyLnByZXNzSGFuZGxlci5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICAgICAgICAgIGxpc3RlbmVyLmV4ZWN1dGluZ0hhbmRsZXIgPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYgKHByZXZlbnRSZXBlYXQgfHwgbGlzdGVuZXIucHJldmVudFJlcGVhdEJ5RGVmYXVsdCkge1xuICAgICAgICAgICAgICBsaXN0ZW5lci5wcmV2ZW50UmVwZWF0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgcHJldmVudFJlcGVhdCAgICAgICAgICA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0aGlzLl9hcHBsaWVkTGlzdGVuZXJzLmluZGV4T2YobGlzdGVuZXIpID09PSAtMSkge1xuICAgICAgICAgICAgdGhpcy5fYXBwbGllZExpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoa2V5Q29tYm8pIHtcbiAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGtleUNvbWJvLmtleU5hbWVzLmxlbmd0aDsgaiArPSAxKSB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHByZXNzZWRLZXlzLmluZGV4T2Yoa2V5Q29tYm8ua2V5TmFtZXNbal0pO1xuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICBwcmVzc2VkS2V5cy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICBqIC09IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgX2NsZWFyQmluZGluZ3MoZXZlbnQpIHtcbiAgICBldmVudCB8fCAoZXZlbnQgPSB7fSk7XG4gICAgZXZlbnQucHJlc3NlZEtleXMgPSB0aGlzLl9sb2NhbGUucHJlc3NlZEtleXMuc2xpY2UoMCk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX2FwcGxpZWRMaXN0ZW5lcnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIGNvbnN0IGxpc3RlbmVyID0gdGhpcy5fYXBwbGllZExpc3RlbmVyc1tpXTtcbiAgICAgIGNvbnN0IGtleUNvbWJvID0gbGlzdGVuZXIua2V5Q29tYm87XG4gICAgICBpZiAoa2V5Q29tYm8gPT09IG51bGwgfHwgIWtleUNvbWJvLmNoZWNrKHRoaXMuX2xvY2FsZS5wcmVzc2VkS2V5cykpIHtcbiAgICAgICAgbGlzdGVuZXIucHJldmVudFJlcGVhdCA9IGZhbHNlO1xuICAgICAgICBpZiAoa2V5Q29tYm8gIT09IG51bGwgfHwgZXZlbnQucHJlc3NlZEtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgdGhpcy5fYXBwbGllZExpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgaSAtPSAxO1xuICAgICAgICB9XG4gICAgICAgIGlmICghbGlzdGVuZXIuZXhlY3V0aW5nSGFuZGxlciAmJiBsaXN0ZW5lci5yZWxlYXNlSGFuZGxlcikge1xuICAgICAgICAgIGxpc3RlbmVyLmV4ZWN1dGluZ0hhbmRsZXIgPSB0cnVlO1xuICAgICAgICAgIGxpc3RlbmVyLnJlbGVhc2VIYW5kbGVyLmNhbGwodGhpcywgZXZlbnQpO1xuICAgICAgICAgIGxpc3RlbmVyLmV4ZWN1dGluZ0hhbmRsZXIgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIF9oYW5kbGVDb21tYW5kQnVnKGV2ZW50LCBwbGF0Zm9ybSkge1xuICAgIC8vIE9uIE1hYyB3aGVuIHRoZSBjb21tYW5kIGtleSBpcyBrZXB0IHByZXNzZWQsIGtleXVwIGlzIG5vdCB0cmlnZ2VyZWQgZm9yIGFueSBvdGhlciBrZXkuXG4gICAgLy8gSW4gdGhpcyBjYXNlIGZvcmNlIGEga2V5dXAgZm9yIG5vbi1tb2RpZmllciBrZXlzIGRpcmVjdGx5IGFmdGVyIHRoZSBrZXlwcmVzcy5cbiAgICBjb25zdCBtb2RpZmllcktleXMgPSBbXCJzaGlmdFwiLCBcImN0cmxcIiwgXCJhbHRcIiwgXCJjYXBzbG9ja1wiLCBcInRhYlwiLCBcImNvbW1hbmRcIl07XG4gICAgaWYgKHBsYXRmb3JtLm1hdGNoKFwiTWFjXCIpICYmIHRoaXMuX2xvY2FsZS5wcmVzc2VkS2V5cy5pbmNsdWRlcyhcImNvbW1hbmRcIikgJiZcbiAgICAgICAgIW1vZGlmaWVyS2V5cy5pbmNsdWRlcyh0aGlzLl9sb2NhbGUuZ2V0S2V5TmFtZXMoZXZlbnQua2V5Q29kZSlbMF0pKSB7XG4gICAgICB0aGlzLl90YXJnZXRLZXlVcEJpbmRpbmcoZXZlbnQpO1xuICAgIH1cbiAgfVxufVxuIiwiXG5leHBvcnQgZnVuY3Rpb24gdXMobG9jYWxlLCBwbGF0Zm9ybSwgdXNlckFnZW50KSB7XG5cbiAgLy8gZ2VuZXJhbFxuICBsb2NhbGUuYmluZEtleUNvZGUoMywgICBbJ2NhbmNlbCddKTtcbiAgbG9jYWxlLmJpbmRLZXlDb2RlKDgsICAgWydiYWNrc3BhY2UnXSk7XG4gIGxvY2FsZS5iaW5kS2V5Q29kZSg5LCAgIFsndGFiJ10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoMTIsICBbJ2NsZWFyJ10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoMTMsICBbJ2VudGVyJ10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoMTYsICBbJ3NoaWZ0J10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoMTcsICBbJ2N0cmwnXSk7XG4gIGxvY2FsZS5iaW5kS2V5Q29kZSgxOCwgIFsnYWx0JywgJ21lbnUnXSk7XG4gIGxvY2FsZS5iaW5kS2V5Q29kZSgxOSwgIFsncGF1c2UnLCAnYnJlYWsnXSk7XG4gIGxvY2FsZS5iaW5kS2V5Q29kZSgyMCwgIFsnY2Fwc2xvY2snXSk7XG4gIGxvY2FsZS5iaW5kS2V5Q29kZSgyNywgIFsnZXNjYXBlJywgJ2VzYyddKTtcbiAgbG9jYWxlLmJpbmRLZXlDb2RlKDMyLCAgWydzcGFjZScsICdzcGFjZWJhciddKTtcbiAgbG9jYWxlLmJpbmRLZXlDb2RlKDMzLCAgWydwYWdldXAnXSk7XG4gIGxvY2FsZS5iaW5kS2V5Q29kZSgzNCwgIFsncGFnZWRvd24nXSk7XG4gIGxvY2FsZS5iaW5kS2V5Q29kZSgzNSwgIFsnZW5kJ10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoMzYsICBbJ2hvbWUnXSk7XG4gIGxvY2FsZS5iaW5kS2V5Q29kZSgzNywgIFsnbGVmdCddKTtcbiAgbG9jYWxlLmJpbmRLZXlDb2RlKDM4LCAgWyd1cCddKTtcbiAgbG9jYWxlLmJpbmRLZXlDb2RlKDM5LCAgWydyaWdodCddKTtcbiAgbG9jYWxlLmJpbmRLZXlDb2RlKDQwLCAgWydkb3duJ10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoNDEsICBbJ3NlbGVjdCddKTtcbiAgbG9jYWxlLmJpbmRLZXlDb2RlKDQyLCAgWydwcmludHNjcmVlbiddKTtcbiAgbG9jYWxlLmJpbmRLZXlDb2RlKDQzLCAgWydleGVjdXRlJ10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoNDQsICBbJ3NuYXBzaG90J10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoNDUsICBbJ2luc2VydCcsICdpbnMnXSk7XG4gIGxvY2FsZS5iaW5kS2V5Q29kZSg0NiwgIFsnZGVsZXRlJywgJ2RlbCddKTtcbiAgbG9jYWxlLmJpbmRLZXlDb2RlKDQ3LCAgWydoZWxwJ10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoMTQ1LCBbJ3Njcm9sbGxvY2snLCAnc2Nyb2xsJ10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoMTg4LCBbJ2NvbW1hJywgJywnXSk7XG4gIGxvY2FsZS5iaW5kS2V5Q29kZSgxOTAsIFsncGVyaW9kJywgJy4nXSk7XG4gIGxvY2FsZS5iaW5kS2V5Q29kZSgxOTEsIFsnc2xhc2gnLCAnZm9yd2FyZHNsYXNoJywgJy8nXSk7XG4gIGxvY2FsZS5iaW5kS2V5Q29kZSgxOTIsIFsnZ3JhdmVhY2NlbnQnLCAnYCddKTtcbiAgbG9jYWxlLmJpbmRLZXlDb2RlKDIxOSwgWydvcGVuYnJhY2tldCcsICdbJ10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoMjIwLCBbJ2JhY2tzbGFzaCcsICdcXFxcJ10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoMjIxLCBbJ2Nsb3NlYnJhY2tldCcsICddJ10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoMjIyLCBbJ2Fwb3N0cm9waGUnLCAnXFwnJ10pO1xuXG4gIC8vIDAtOVxuICBsb2NhbGUuYmluZEtleUNvZGUoNDgsIFsnemVybycsICcwJ10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoNDksIFsnb25lJywgJzEnXSk7XG4gIGxvY2FsZS5iaW5kS2V5Q29kZSg1MCwgWyd0d28nLCAnMiddKTtcbiAgbG9jYWxlLmJpbmRLZXlDb2RlKDUxLCBbJ3RocmVlJywgJzMnXSk7XG4gIGxvY2FsZS5iaW5kS2V5Q29kZSg1MiwgWydmb3VyJywgJzQnXSk7XG4gIGxvY2FsZS5iaW5kS2V5Q29kZSg1MywgWydmaXZlJywgJzUnXSk7XG4gIGxvY2FsZS5iaW5kS2V5Q29kZSg1NCwgWydzaXgnLCAnNiddKTtcbiAgbG9jYWxlLmJpbmRLZXlDb2RlKDU1LCBbJ3NldmVuJywgJzcnXSk7XG4gIGxvY2FsZS5iaW5kS2V5Q29kZSg1NiwgWydlaWdodCcsICc4J10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoNTcsIFsnbmluZScsICc5J10pO1xuXG4gIC8vIG51bXBhZFxuICBsb2NhbGUuYmluZEtleUNvZGUoOTYsIFsnbnVtemVybycsICdudW0wJ10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoOTcsIFsnbnVtb25lJywgJ251bTEnXSk7XG4gIGxvY2FsZS5iaW5kS2V5Q29kZSg5OCwgWydudW10d28nLCAnbnVtMiddKTtcbiAgbG9jYWxlLmJpbmRLZXlDb2RlKDk5LCBbJ251bXRocmVlJywgJ251bTMnXSk7XG4gIGxvY2FsZS5iaW5kS2V5Q29kZSgxMDAsIFsnbnVtZm91cicsICdudW00J10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoMTAxLCBbJ251bWZpdmUnLCAnbnVtNSddKTtcbiAgbG9jYWxlLmJpbmRLZXlDb2RlKDEwMiwgWydudW1zaXgnLCAnbnVtNiddKTtcbiAgbG9jYWxlLmJpbmRLZXlDb2RlKDEwMywgWydudW1zZXZlbicsICdudW03J10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoMTA0LCBbJ251bWVpZ2h0JywgJ251bTgnXSk7XG4gIGxvY2FsZS5iaW5kS2V5Q29kZSgxMDUsIFsnbnVtbmluZScsICdudW05J10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoMTA2LCBbJ251bW11bHRpcGx5JywgJ251bSonXSk7XG4gIGxvY2FsZS5iaW5kS2V5Q29kZSgxMDcsIFsnbnVtYWRkJywgJ251bSsnXSk7XG4gIGxvY2FsZS5iaW5kS2V5Q29kZSgxMDgsIFsnbnVtZW50ZXInXSk7XG4gIGxvY2FsZS5iaW5kS2V5Q29kZSgxMDksIFsnbnVtc3VidHJhY3QnLCAnbnVtLSddKTtcbiAgbG9jYWxlLmJpbmRLZXlDb2RlKDExMCwgWydudW1kZWNpbWFsJywgJ251bS4nXSk7XG4gIGxvY2FsZS5iaW5kS2V5Q29kZSgxMTEsIFsnbnVtZGl2aWRlJywgJ251bS8nXSk7XG4gIGxvY2FsZS5iaW5kS2V5Q29kZSgxNDQsIFsnbnVtbG9jaycsICdudW0nXSk7XG5cbiAgLy8gZnVuY3Rpb24ga2V5c1xuICBsb2NhbGUuYmluZEtleUNvZGUoMTEyLCBbJ2YxJ10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoMTEzLCBbJ2YyJ10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoMTE0LCBbJ2YzJ10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoMTE1LCBbJ2Y0J10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoMTE2LCBbJ2Y1J10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoMTE3LCBbJ2Y2J10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoMTE4LCBbJ2Y3J10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoMTE5LCBbJ2Y4J10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoMTIwLCBbJ2Y5J10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoMTIxLCBbJ2YxMCddKTtcbiAgbG9jYWxlLmJpbmRLZXlDb2RlKDEyMiwgWydmMTEnXSk7XG4gIGxvY2FsZS5iaW5kS2V5Q29kZSgxMjMsIFsnZjEyJ10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoMTI0LCBbJ2YxMyddKTtcbiAgbG9jYWxlLmJpbmRLZXlDb2RlKDEyNSwgWydmMTQnXSk7XG4gIGxvY2FsZS5iaW5kS2V5Q29kZSgxMjYsIFsnZjE1J10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoMTI3LCBbJ2YxNiddKTtcbiAgbG9jYWxlLmJpbmRLZXlDb2RlKDEyOCwgWydmMTcnXSk7XG4gIGxvY2FsZS5iaW5kS2V5Q29kZSgxMjksIFsnZjE4J10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoMTMwLCBbJ2YxOSddKTtcbiAgbG9jYWxlLmJpbmRLZXlDb2RlKDEzMSwgWydmMjAnXSk7XG4gIGxvY2FsZS5iaW5kS2V5Q29kZSgxMzIsIFsnZjIxJ10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoMTMzLCBbJ2YyMiddKTtcbiAgbG9jYWxlLmJpbmRLZXlDb2RlKDEzNCwgWydmMjMnXSk7XG4gIGxvY2FsZS5iaW5kS2V5Q29kZSgxMzUsIFsnZjI0J10pO1xuXG4gIC8vIHNlY29uZGFyeSBrZXkgc3ltYm9sc1xuICBsb2NhbGUuYmluZE1hY3JvKCdzaGlmdCArIGAnLCBbJ3RpbGRlJywgJ34nXSk7XG4gIGxvY2FsZS5iaW5kTWFjcm8oJ3NoaWZ0ICsgMScsIFsnZXhjbGFtYXRpb24nLCAnZXhjbGFtYXRpb25wb2ludCcsICchJ10pO1xuICBsb2NhbGUuYmluZE1hY3JvKCdzaGlmdCArIDInLCBbJ2F0JywgJ0AnXSk7XG4gIGxvY2FsZS5iaW5kTWFjcm8oJ3NoaWZ0ICsgMycsIFsnbnVtYmVyJywgJyMnXSk7XG4gIGxvY2FsZS5iaW5kTWFjcm8oJ3NoaWZ0ICsgNCcsIFsnZG9sbGFyJywgJ2RvbGxhcnMnLCAnZG9sbGFyc2lnbicsICckJ10pO1xuICBsb2NhbGUuYmluZE1hY3JvKCdzaGlmdCArIDUnLCBbJ3BlcmNlbnQnLCAnJSddKTtcbiAgbG9jYWxlLmJpbmRNYWNybygnc2hpZnQgKyA2JywgWydjYXJldCcsICdeJ10pO1xuICBsb2NhbGUuYmluZE1hY3JvKCdzaGlmdCArIDcnLCBbJ2FtcGVyc2FuZCcsICdhbmQnLCAnJiddKTtcbiAgbG9jYWxlLmJpbmRNYWNybygnc2hpZnQgKyA4JywgWydhc3RlcmlzaycsICcqJ10pO1xuICBsb2NhbGUuYmluZE1hY3JvKCdzaGlmdCArIDknLCBbJ29wZW5wYXJlbicsICcoJ10pO1xuICBsb2NhbGUuYmluZE1hY3JvKCdzaGlmdCArIDAnLCBbJ2Nsb3NlcGFyZW4nLCAnKSddKTtcbiAgbG9jYWxlLmJpbmRNYWNybygnc2hpZnQgKyAtJywgWyd1bmRlcnNjb3JlJywgJ18nXSk7XG4gIGxvY2FsZS5iaW5kTWFjcm8oJ3NoaWZ0ICsgPScsIFsncGx1cycsICcrJ10pO1xuICBsb2NhbGUuYmluZE1hY3JvKCdzaGlmdCArIFsnLCBbJ29wZW5jdXJseWJyYWNlJywgJ29wZW5jdXJseWJyYWNrZXQnLCAneyddKTtcbiAgbG9jYWxlLmJpbmRNYWNybygnc2hpZnQgKyBdJywgWydjbG9zZWN1cmx5YnJhY2UnLCAnY2xvc2VjdXJseWJyYWNrZXQnLCAnfSddKTtcbiAgbG9jYWxlLmJpbmRNYWNybygnc2hpZnQgKyBcXFxcJywgWyd2ZXJ0aWNhbGJhcicsICd8J10pO1xuICBsb2NhbGUuYmluZE1hY3JvKCdzaGlmdCArIDsnLCBbJ2NvbG9uJywgJzonXSk7XG4gIGxvY2FsZS5iaW5kTWFjcm8oJ3NoaWZ0ICsgXFwnJywgWydxdW90YXRpb25tYXJrJywgJ1xcJyddKTtcbiAgbG9jYWxlLmJpbmRNYWNybygnc2hpZnQgKyAhLCcsIFsnb3BlbmFuZ2xlYnJhY2tldCcsICc8J10pO1xuICBsb2NhbGUuYmluZE1hY3JvKCdzaGlmdCArIC4nLCBbJ2Nsb3NlYW5nbGVicmFja2V0JywgJz4nXSk7XG4gIGxvY2FsZS5iaW5kTWFjcm8oJ3NoaWZ0ICsgLycsIFsncXVlc3Rpb25tYXJrJywgJz8nXSk7XG5cbiAgaWYgKHBsYXRmb3JtLm1hdGNoKCdNYWMnKSkge1xuICAgIGxvY2FsZS5iaW5kTWFjcm8oJ2NvbW1hbmQnLCBbJ21vZCcsICdtb2RpZmllciddKTtcbiAgfSBlbHNlIHtcbiAgICBsb2NhbGUuYmluZE1hY3JvKCdjdHJsJywgWydtb2QnLCAnbW9kaWZpZXInXSk7XG4gIH1cblxuICAvL2EteiBhbmQgQS1aXG4gIGZvciAobGV0IGtleUNvZGUgPSA2NTsga2V5Q29kZSA8PSA5MDsga2V5Q29kZSArPSAxKSB7XG4gICAgdmFyIGtleU5hbWUgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGtleUNvZGUgKyAzMik7XG4gICAgdmFyIGNhcGl0YWxLZXlOYW1lID0gU3RyaW5nLmZyb21DaGFyQ29kZShrZXlDb2RlKTtcbiAgXHRsb2NhbGUuYmluZEtleUNvZGUoa2V5Q29kZSwga2V5TmFtZSk7XG4gIFx0bG9jYWxlLmJpbmRNYWNybygnc2hpZnQgKyAnICsga2V5TmFtZSwgY2FwaXRhbEtleU5hbWUpO1xuICBcdGxvY2FsZS5iaW5kTWFjcm8oJ2NhcHNsb2NrICsgJyArIGtleU5hbWUsIGNhcGl0YWxLZXlOYW1lKTtcbiAgfVxuXG4gIC8vIGJyb3dzZXIgY2F2ZWF0c1xuICBjb25zdCBzZW1pY29sb25LZXlDb2RlID0gdXNlckFnZW50Lm1hdGNoKCdGaXJlZm94JykgPyA1OSAgOiAxODY7XG4gIGNvbnN0IGRhc2hLZXlDb2RlICAgICAgPSB1c2VyQWdlbnQubWF0Y2goJ0ZpcmVmb3gnKSA/IDE3MyA6IDE4OTtcbiAgY29uc3QgZXF1YWxLZXlDb2RlICAgICA9IHVzZXJBZ2VudC5tYXRjaCgnRmlyZWZveCcpID8gNjEgIDogMTg3O1xuICBsZXQgbGVmdENvbW1hbmRLZXlDb2RlO1xuICBsZXQgcmlnaHRDb21tYW5kS2V5Q29kZTtcbiAgaWYgKHBsYXRmb3JtLm1hdGNoKCdNYWMnKSAmJiAodXNlckFnZW50Lm1hdGNoKCdTYWZhcmknKSB8fCB1c2VyQWdlbnQubWF0Y2goJ0Nocm9tZScpKSkge1xuICAgIGxlZnRDb21tYW5kS2V5Q29kZSAgPSA5MTtcbiAgICByaWdodENvbW1hbmRLZXlDb2RlID0gOTM7XG4gIH0gZWxzZSBpZihwbGF0Zm9ybS5tYXRjaCgnTWFjJykgJiYgdXNlckFnZW50Lm1hdGNoKCdPcGVyYScpKSB7XG4gICAgbGVmdENvbW1hbmRLZXlDb2RlICA9IDE3O1xuICAgIHJpZ2h0Q29tbWFuZEtleUNvZGUgPSAxNztcbiAgfSBlbHNlIGlmKHBsYXRmb3JtLm1hdGNoKCdNYWMnKSAmJiB1c2VyQWdlbnQubWF0Y2goJ0ZpcmVmb3gnKSkge1xuICAgIGxlZnRDb21tYW5kS2V5Q29kZSAgPSAyMjQ7XG4gICAgcmlnaHRDb21tYW5kS2V5Q29kZSA9IDIyNDtcbiAgfVxuICBsb2NhbGUuYmluZEtleUNvZGUoc2VtaWNvbG9uS2V5Q29kZSwgICAgWydzZW1pY29sb24nLCAnOyddKTtcbiAgbG9jYWxlLmJpbmRLZXlDb2RlKGRhc2hLZXlDb2RlLCAgICAgICAgIFsnZGFzaCcsICctJ10pO1xuICBsb2NhbGUuYmluZEtleUNvZGUoZXF1YWxLZXlDb2RlLCAgICAgICAgWydlcXVhbCcsICdlcXVhbHNpZ24nLCAnPSddKTtcbiAgbG9jYWxlLmJpbmRLZXlDb2RlKGxlZnRDb21tYW5kS2V5Q29kZSwgIFsnY29tbWFuZCcsICd3aW5kb3dzJywgJ3dpbicsICdzdXBlcicsICdsZWZ0Y29tbWFuZCcsICdsZWZ0d2luZG93cycsICdsZWZ0d2luJywgJ2xlZnRzdXBlciddKTtcbiAgbG9jYWxlLmJpbmRLZXlDb2RlKHJpZ2h0Q29tbWFuZEtleUNvZGUsIFsnY29tbWFuZCcsICd3aW5kb3dzJywgJ3dpbicsICdzdXBlcicsICdyaWdodGNvbW1hbmQnLCAncmlnaHR3aW5kb3dzJywgJ3JpZ2h0d2luJywgJ3JpZ2h0c3VwZXInXSk7XG5cbiAgLy8ga2lsbCBrZXlzXG4gIGxvY2FsZS5zZXRLaWxsS2V5KCdjb21tYW5kJyk7XG59O1xuIiwiaW1wb3J0IHsgS2V5Ym9hcmQgfSBmcm9tICcuL2xpYi9rZXlib2FyZCc7XG5pbXBvcnQgeyBMb2NhbGUgfSBmcm9tICcuL2xpYi9sb2NhbGUnO1xuaW1wb3J0IHsgS2V5Q29tYm8gfSBmcm9tICcuL2xpYi9rZXktY29tYm8nO1xuaW1wb3J0IHsgdXMgfSBmcm9tICcuL2xvY2FsZXMvdXMnO1xuXG5jb25zdCBrZXlib2FyZCA9IG5ldyBLZXlib2FyZCgpO1xuXG5rZXlib2FyZC5zZXRMb2NhbGUoJ3VzJywgdXMpO1xuXG5rZXlib2FyZC5LZXlib2FyZCA9IEtleWJvYXJkO1xua2V5Ym9hcmQuTG9jYWxlID0gTG9jYWxlO1xua2V5Ym9hcmQuS2V5Q29tYm8gPSBLZXlDb21ibztcblxuZXhwb3J0IGRlZmF1bHQga2V5Ym9hcmQ7XG4iXSwibmFtZXMiOlsiS2V5Q29tYm8iLCJrZXlDb21ib1N0ciIsInNvdXJjZVN0ciIsInN1YkNvbWJvcyIsInBhcnNlQ29tYm9TdHIiLCJrZXlOYW1lcyIsInJlZHVjZSIsIm1lbW8iLCJuZXh0U3ViQ29tYm8iLCJjb25jYXQiLCJwcmVzc2VkS2V5TmFtZXMiLCJzdGFydGluZ0tleU5hbWVJbmRleCIsImkiLCJsZW5ndGgiLCJfY2hlY2tTdWJDb21ibyIsIm90aGVyS2V5Q29tYm8iLCJzdWJDb21ibyIsIm90aGVyU3ViQ29tYm8iLCJzbGljZSIsImoiLCJrZXlOYW1lIiwiaW5kZXgiLCJpbmRleE9mIiwic3BsaWNlIiwiZW5kSW5kZXgiLCJlc2NhcGVkS2V5TmFtZSIsImNvbWJvRGVsaW1pbmF0b3IiLCJrZXlEZWxpbWluYXRvciIsInN1YkNvbWJvU3RycyIsIl9zcGxpdFN0ciIsImNvbWJvIiwicHVzaCIsInN0ciIsImRlbGltaW5hdG9yIiwicyIsImQiLCJjIiwiY2EiLCJjaSIsInRyaW0iLCJMb2NhbGUiLCJuYW1lIiwibG9jYWxlTmFtZSIsImFjdGl2ZVRhcmdldEtleXMiLCJwcmVzc2VkS2V5cyIsIl9hcHBsaWVkTWFjcm9zIiwiX2tleU1hcCIsIl9raWxsS2V5Q29kZXMiLCJfbWFjcm9zIiwia2V5Q29kZSIsImhhbmRsZXIiLCJtYWNybyIsImtleUNvbWJvIiwia2V5Q29kZXMiLCJnZXRLZXlDb2RlcyIsInNldEtpbGxLZXkiLCJwcmVzc0tleSIsImdldEtleU5hbWVzIiwiX2FwcGx5TWFjcm9zIiwicmVsZWFzZUtleSIsImtpbGxLZXlDb2RlSW5kZXgiLCJfY2xlYXJNYWNyb3MiLCJtYWNyb3MiLCJjaGVjayIsIktleWJvYXJkIiwidGFyZ2V0V2luZG93IiwidGFyZ2V0RWxlbWVudCIsInRhcmdldFBsYXRmb3JtIiwidGFyZ2V0VXNlckFnZW50IiwiX2xvY2FsZSIsIl9jdXJyZW50Q29udGV4dCIsIl9jb250ZXh0cyIsIl9saXN0ZW5lcnMiLCJfYXBwbGllZExpc3RlbmVycyIsIl9sb2NhbGVzIiwiX3RhcmdldEVsZW1lbnQiLCJfdGFyZ2V0V2luZG93IiwiX3RhcmdldFBsYXRmb3JtIiwiX3RhcmdldFVzZXJBZ2VudCIsIl9pc01vZGVybkJyb3dzZXIiLCJfdGFyZ2V0S2V5RG93bkJpbmRpbmciLCJfdGFyZ2V0S2V5VXBCaW5kaW5nIiwiX3RhcmdldFJlc2V0QmluZGluZyIsIl9wYXVzZWQiLCJnbG9iYWwiLCJsaXN0ZW5lcnMiLCJzZXRDb250ZXh0IiwibG9jYWxlQnVpbGRlciIsImxvY2FsZSIsIl9sb2NhbGVOYW1lIiwibG9jYWxOYW1lIiwicHJlc3NIYW5kbGVyIiwicmVsZWFzZUhhbmRsZXIiLCJwcmV2ZW50UmVwZWF0QnlEZWZhdWx0IiwiYmluZCIsInByZXZlbnRSZXBlYXQiLCJleGVjdXRpbmdIYW5kbGVyIiwidW5iaW5kIiwibGlzdGVuZXIiLCJjb21ib01hdGNoZXMiLCJpc0VxdWFsIiwicHJlc3NIYW5kbGVyTWF0Y2hlcyIsInJlbGVhc2VIYW5kbGVyTWF0Y2hlcyIsImNvbnRleHROYW1lIiwicmVsZWFzZUFsbEtleXMiLCJnbG9iYWxDb250ZXh0IiwiY29udGV4dCIsInN0b3AiLCJ3YXRjaCIsImNhbGxiYWNrIiwicHJldmlvdXNDb250ZXh0TmFtZSIsImdldENvbnRleHQiLCJ3aW4iLCJnbG9iYWxUaGlzIiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsImF0dGFjaEV2ZW50IiwiRXJyb3IiLCJub2RlVHlwZSIsInVzZXJBZ2VudCIsIm5hdmlnYXRvciIsInBsYXRmb3JtIiwiZG9jdW1lbnQiLCJldmVudCIsIl9oYW5kbGVDb21tYW5kQnVnIiwiX2JpbmRFdmVudCIsImN1cnJlbnRDb250ZXh0IiwiX3VuYmluZEV2ZW50IiwiX2FwcGx5QmluZGluZ3MiLCJfY2xlYXJCaW5kaW5ncyIsImV2ZW50TmFtZSIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJkZXRhY2hFdmVudCIsImxpc3RlbmVyR3JvdXBzIiwibGlzdGVuZXJHcm91cE1hcCIsInNvcnQiLCJhIiwiYiIsImZvckVhY2giLCJsIiwibWFwSW5kZXgiLCJfZ2V0R3JvdXBlZExpc3RlbmVycyIsInNvbWUiLCJrIiwiaW5jbHVkZXMiLCJjYWxsIiwibW9kaWZpZXJLZXlzIiwibWF0Y2giLCJ1cyIsImJpbmRLZXlDb2RlIiwiYmluZE1hY3JvIiwiU3RyaW5nIiwiZnJvbUNoYXJDb2RlIiwiY2FwaXRhbEtleU5hbWUiLCJzZW1pY29sb25LZXlDb2RlIiwiZGFzaEtleUNvZGUiLCJlcXVhbEtleUNvZGUiLCJsZWZ0Q29tbWFuZEtleUNvZGUiLCJyaWdodENvbW1hbmRLZXlDb2RlIiwia2V5Ym9hcmQiLCJzZXRMb2NhbGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O01BQ2FBLFFBQWI7RUFDRSxvQkFBWUMsV0FBWixFQUF5QjtFQUFBOztFQUN2QixTQUFLQyxTQUFMLEdBQWlCRCxXQUFqQjtFQUNBLFNBQUtFLFNBQUwsR0FBaUJILFFBQVEsQ0FBQ0ksYUFBVCxDQUF1QkgsV0FBdkIsQ0FBakI7RUFDQSxTQUFLSSxRQUFMLEdBQWlCLEtBQUtGLFNBQUwsQ0FBZUcsTUFBZixDQUFzQixVQUFDQyxJQUFELEVBQU9DLFlBQVA7RUFBQSxhQUNyQ0QsSUFBSSxDQUFDRSxNQUFMLENBQVlELFlBQVosQ0FEcUM7RUFBQSxLQUF0QixFQUNZLEVBRFosQ0FBakI7RUFFRDs7RUFOSDtFQUFBO0VBQUEsMEJBUVFFLGVBUlIsRUFReUI7RUFDckIsVUFBSUMsb0JBQW9CLEdBQUcsQ0FBM0I7O0VBQ0EsV0FBSyxJQUFJQyxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHLEtBQUtULFNBQUwsQ0FBZVUsTUFBbkMsRUFBMkNELENBQUMsSUFBSSxDQUFoRCxFQUFtRDtFQUNqREQsUUFBQUEsb0JBQW9CLEdBQUcsS0FBS0csY0FBTCxDQUNyQixLQUFLWCxTQUFMLENBQWVTLENBQWYsQ0FE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
    });

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

    // (154:2) {#each inputs as {id, name, state}}
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
    			add_location(div, file$1, 154, 2, 5506);
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
    		source: "(154:2) {#each inputs as {id, name, state}}",
    		ctx
    	});

    	return block;
    }

    // (161:2) {#each outputs as {id, name, state}}
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
    			add_location(div, file$1, 161, 2, 5689);
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
    		source: "(161:2) {#each outputs as {id, name, state}}",
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
    	let div12;
    	let div9;
    	let div8;
    	let t11;
    	let t12;
    	let t13;
    	let div11;
    	let div10;
    	let t14;
    	let t15;
    	let t16;
    	let div13;
    	let trackcontrols;
    	let t17;
    	let div14;
    	let t18;
    	let rangeslider;
    	let t19;
    	let div15;
    	let todo;
    	let t20;
    	let div16;
    	let t21;
    	let div17;
    	let knob0;
    	let t22;
    	let knob1;
    	let t23;
    	let knob2;
    	let t24;
    	let knob3;
    	let t25;
    	let div18;
    	let p0;
    	let p1;
    	let p2;
    	let p3;
    	let t27;
    	let div19;
    	let joystickcontrols;
    	let t28;
    	let div24;
    	let div20;
    	let t29;
    	let div21;
    	let t30;
    	let div22;
    	let t31;
    	let div23;
    	let current;
    	let mounted;
    	let dispose;
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

    	rangeslider = new RangeSlider({
    			props: {
    				pips: true,
    				min: 0,
    				max: 127,
    				values: 127
    			},
    			$$inline: true
    		});

    	todo = new Todo({ $$inline: true });
    	knob0 = new Knob({ $$inline: true });
    	knob1 = new Knob({ $$inline: true });
    	knob2 = new Knob({ $$inline: true });
    	knob3 = new Knob({ $$inline: true });
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
    			div12 = element("div");
    			div9 = element("div");
    			div8 = element("div");
    			t11 = text("Inputs");
    			t12 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t13 = space();
    			div11 = element("div");
    			div10 = element("div");
    			t14 = text("Outputs");
    			t15 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t16 = space();
    			div13 = element("div");
    			create_component(trackcontrols.$$.fragment);
    			t17 = space();
    			div14 = element("div");
    			t18 = text("Hello RangeSlider\n");
    			create_component(rangeslider.$$.fragment);
    			t19 = space();
    			div15 = element("div");
    			create_component(todo.$$.fragment);
    			t20 = space();
    			div16 = element("div");
    			t21 = space();
    			div17 = element("div");
    			create_component(knob0.$$.fragment);
    			t22 = space();
    			create_component(knob1.$$.fragment);
    			t23 = space();
    			create_component(knob2.$$.fragment);
    			t24 = space();
    			create_component(knob3.$$.fragment);
    			t25 = space();
    			div18 = element("div");
    			p0 = element("p");
    			p1 = element("p");
    			p2 = element("p");
    			p3 = element("p");
    			p3.textContent = " ";
    			t27 = space();
    			div19 = element("div");
    			create_component(joystickcontrols.$$.fragment);
    			t28 = space();
    			div24 = element("div");
    			div20 = element("div");
    			t29 = space();
    			div21 = element("div");
    			t30 = space();
    			div22 = element("div");
    			t31 = space();
    			div23 = element("div");
    			add_location(div0, file$1, 140, 2, 4905);

    			attr_dev(i0, "class", i0_class_value = "" + (null_to_empty(/*isEnabled*/ ctx[0]
    			? /*isEnabledStyle*/ ctx[4]
    			: /*isNotEnabledStyle*/ ctx[3]) + " svelte-4zo826"));

    			add_location(i0, file$1, 141, 63, 4980);
    			attr_dev(div1, "class", "" + (null_to_empty(btnStyle) + " svelte-4zo826"));
    			add_location(div1, file$1, 141, 2, 4919);

    			attr_dev(i1, "class", i1_class_value = "" + (null_to_empty(/*isEnabled*/ ctx[0]
    			? /*isEnabledStyle*/ ctx[4]
    			: /*isNotEnabledStyle*/ ctx[3]) + " svelte-4zo826"));

    			add_location(i1, file$1, 142, 65, 5111);
    			attr_dev(div2, "class", "" + (null_to_empty(btnStyle) + " svelte-4zo826"));
    			add_location(div2, file$1, 142, 2, 5048);
    			attr_dev(div3, "class", "" + (null_to_empty(btnStyle) + " svelte-4zo826"));
    			add_location(div3, file$1, 143, 2, 5179);
    			attr_dev(div4, "class", "" + (null_to_empty(btnStyle) + " svelte-4zo826"));
    			add_location(div4, file$1, 144, 2, 5242);
    			attr_dev(div5, "class", "" + (null_to_empty(btnStyle) + " svelte-4zo826"));
    			add_location(div5, file$1, 145, 2, 5310);
    			attr_dev(div6, "class", "flex");
    			add_location(div6, file$1, 139, 1, 4884);
    			add_location(div7, file$1, 138, 0, 4876);
    			attr_dev(div8, "class", "" + (null_to_empty(rowTitleClass) + " svelte-4zo826"));
    			add_location(div8, file$1, 152, 2, 5424);
    			add_location(div9, file$1, 151, 1, 5414);
    			attr_dev(div10, "class", "" + (null_to_empty(rowTitleClass) + " svelte-4zo826"));
    			add_location(div10, file$1, 159, 2, 5605);
    			attr_dev(div11, "class", "ml2");
    			add_location(div11, file$1, 158, 1, 5581);
    			attr_dev(div12, "class", "flex mt2");
    			add_location(div12, file$1, 149, 0, 5388);
    			attr_dev(div13, "class", "flex mt2");
    			add_location(div13, file$1, 167, 0, 5771);
    			attr_dev(div14, "class", "flex mt2");
    			add_location(div14, file$1, 171, 0, 5821);
    			attr_dev(div15, "class", "flex fr");
    			add_location(div15, file$1, 182, 0, 5986);
    			attr_dev(div16, "class", "flex mt2");
    			add_location(div16, file$1, 184, 0, 6022);
    			attr_dev(div17, "class", "flex flex-row mt2 fit");
    			add_location(div17, file$1, 192, 0, 6104);
    			add_location(p0, file$1, 201, 1, 6197);
    			add_location(p1, file$1, 202, 2, 6203);
    			add_location(p2, file$1, 203, 3, 6210);
    			add_location(p3, file$1, 204, 4, 6218);
    			add_location(div18, file$1, 199, 0, 6189);
    			attr_dev(div19, "class", "flex mt2");
    			add_location(div19, file$1, 207, 0, 6241);
    			attr_dev(div20, "id", "joy01");
    			attr_dev(div20, "class", "zone static active svelte-4zo826");
    			set_style(div20, "touch-action", "none");
    			add_location(div20, file$1, 213, 1, 6333);
    			attr_dev(div21, "id", "joy02");
    			add_location(div21, file$1, 216, 1, 6417);
    			attr_dev(div22, "id", "joy03");
    			add_location(div22, file$1, 217, 1, 6441);
    			attr_dev(div23, "id", "joy04");
    			add_location(div23, file$1, 218, 1, 6465);
    			attr_dev(div24, "id", "zone_joystick");
    			attr_dev(div24, "class", "mt2 svelte-4zo826");
    			add_location(div24, file$1, 211, 0, 6294);
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
    			insert_dev(target, div12, anchor);
    			append_dev(div12, div9);
    			append_dev(div9, div8);
    			append_dev(div8, t11);
    			append_dev(div9, t12);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div9, null);
    			}

    			append_dev(div12, t13);
    			append_dev(div12, div11);
    			append_dev(div11, div10);
    			append_dev(div10, t14);
    			append_dev(div11, t15);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div11, null);
    			}

    			insert_dev(target, t16, anchor);
    			insert_dev(target, div13, anchor);
    			mount_component(trackcontrols, div13, null);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, div14, anchor);
    			append_dev(div14, t18);
    			mount_component(rangeslider, div14, null);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, div15, anchor);
    			mount_component(todo, div15, null);
    			insert_dev(target, t20, anchor);
    			insert_dev(target, div16, anchor);
    			insert_dev(target, t21, anchor);
    			insert_dev(target, div17, anchor);
    			mount_component(knob0, div17, null);
    			append_dev(div17, t22);
    			mount_component(knob1, div17, null);
    			append_dev(div17, t23);
    			mount_component(knob2, div17, null);
    			append_dev(div17, t24);
    			mount_component(knob3, div17, null);
    			insert_dev(target, t25, anchor);
    			insert_dev(target, div18, anchor);
    			append_dev(div18, p0);
    			append_dev(div18, p1);
    			append_dev(div18, p2);
    			append_dev(div18, p3);
    			insert_dev(target, t27, anchor);
    			insert_dev(target, div19, anchor);
    			mount_component(joystickcontrols, div19, null);
    			insert_dev(target, t28, anchor);
    			insert_dev(target, div24, anchor);
    			append_dev(div24, div20);
    			append_dev(div24, t29);
    			append_dev(div24, div21);
    			append_dev(div24, t30);
    			append_dev(div24, div22);
    			append_dev(div24, t31);
    			append_dev(div24, div23);
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
    						each_blocks_1[i].m(div9, null);
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
    						each_blocks[i].m(div11, null);
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
    			transition_in(trackcontrols.$$.fragment, local);
    			transition_in(rangeslider.$$.fragment, local);
    			transition_in(todo.$$.fragment, local);
    			transition_in(knob0.$$.fragment, local);
    			transition_in(knob1.$$.fragment, local);
    			transition_in(knob2.$$.fragment, local);
    			transition_in(knob3.$$.fragment, local);
    			transition_in(joystickcontrols.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(trackcontrols.$$.fragment, local);
    			transition_out(rangeslider.$$.fragment, local);
    			transition_out(todo.$$.fragment, local);
    			transition_out(knob0.$$.fragment, local);
    			transition_out(knob1.$$.fragment, local);
    			transition_out(knob2.$$.fragment, local);
    			transition_out(knob3.$$.fragment, local);
    			transition_out(joystickcontrols.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(div12);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(div13);
    			destroy_component(trackcontrols);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(div14);
    			destroy_component(rangeslider);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(div15);
    			destroy_component(todo);
    			if (detaching) detach_dev(t20);
    			if (detaching) detach_dev(div16);
    			if (detaching) detach_dev(t21);
    			if (detaching) detach_dev(div17);
    			destroy_component(knob0);
    			destroy_component(knob1);
    			destroy_component(knob2);
    			destroy_component(knob3);
    			if (detaching) detach_dev(t25);
    			if (detaching) detach_dev(div18);
    			if (detaching) detach_dev(t27);
    			if (detaching) detach_dev(div19);
    			destroy_component(joystickcontrols);
    			if (detaching) detach_dev(t28);
    			if (detaching) detach_dev(div24);
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

    	

    	// Joystick 
    	let joy01;

    	let joy02;
    	let joy03;
    	let joy04;

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

    		keyboard.bind(
    			"alt",
    			e => {
    				console.log("alt is pressed");
    			},
    			e => {
    				console.log("alt is released");
    			}
    		);
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
    		Knob,
    		Todo,
    		RangeSlider,
    		nipplejs: nipplejs$1,
    		JoystickManagerOptions: nipplejs.JoystickManagerOptions,
    		prevent_default,
    		set_attributes,
    		keyboardJS: keyboard,
    		joy01,
    		joy02,
    		joy03,
    		joy04,
    		zoom,
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
