import * as njs from "nipplejs";

interface NjsOptions  {
    zone: HTMLElement,                  // active zone
    color: string,
    size: number,
    threshold: number,               // before triggering a directional event
    fadeTime: number,              // transition time
    multitouch: boolean,
    maxNumberOfNipples: number,     // when multitouch, what is too many?
    dataOnly: boolean,              // no dom element whatsoever
    position: object,               // preset position for 'static' mode
    mode: string,                   // 'dynamic', 'static' or 'semi'
    restJoystick: boolean,
    restOpacity: number,            // opacity when not 'dynamic' and rested
    lockX: boolean,                 // only move on the X axis
    lockY: boolean,                 // only move on the Y axis
    catchDistance: number,          // distance to recycle previous joystick in
                                    // 'semi' mode
    shape: string,                  // 'circle' or 'square'
    dynamicPage: boolean,           // Enable if the page has dynamically visible elements
    follow: boolean,                // Makes the joystick follow the thumbstick
};