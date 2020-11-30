import * as PIXI from 'pixi.js';
import MainMessagePage from './js/message_main.js'

// The application will create a renderer using WebGL, if possible,
// with a fallback to a canvas render. It will also setup the ticker
// and the root stage PIXI.Container
const app = new PIXI.Application();
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

let ratio = window.innerWidth / window.innerHeight
let width, height

console.log(window.innerWidth)
console.log(window.innerHeight)

if (ratio < 16.0/9.0) {
    width = window.innerWidth
    height = width * (9.0/16.0)
} else if (ratio > 16.0/9.0) {
    height = window.innerHeight
    width = height * (16.0/9.0)
} else {
    width = window.innerWidth
    height = window.innerHeight
}

console.log(width)
console.log(height)

app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.view.style.left = '50%';
app.renderer.view.style.top = '50%';
app.renderer.view.style.transform = 'translate3d( -50%, -50%, 0 )'
app.renderer.autoResize = true;
app.renderer.backgroundColor = 0xFFFFFF;
app.stage.sortableChildren = true

app.renderer.resize(width, height);

// The application will create a canvas element for you that you
// can then insert into the DOM
document.body.appendChild(app.view);

MainMessagePage.run(app);