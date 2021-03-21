

// TODO: Normalize to 0:127
// Ref: https://stackoverflow.com/questions/13368046/how-to-normalize-a-list-of-positive-numbers-in-javascript
export const normaliseMouse = (event) => {
    let m = { x: 0, y: 0 };
    m.x = event.clientX;
    m.y = event.clientY;

    // Get height and with of screen
const height=1800 
const width = 2400
const ratioX = width / 127
const ratioY = height / 127

let posX = Math.round(m.x / ratioX) 
let posY = Math.round(m.y / ratioY)

console.log('x', posX)
console.log('y', posY)

}