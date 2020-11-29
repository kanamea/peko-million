import * as PIXI from 'pixi.js';
import MainMessagePage from './js/message_main.js'

// The application will create a renderer using WebGL, if possible,
// with a fallback to a canvas render. It will also setup the ticker
// and the root stage PIXI.Container
const app = new PIXI.Application();
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

let ratio = window.innerWidth / window.innerHeight
let width, height

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

app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.view.style.left = '50%';
app.renderer.view.style.top = '50%';
app.renderer.view.style.transform = 'translate3d( -50%, -50%, 0 )'
app.renderer.autoResize = true;
app.renderer.backgroundColor = 0xFFFFFF;
app.renderer.resize(width, height);
app.stage.sortableChildren = true

// The application will create a canvas element for you that you
// can then insert into the DOM
document.body.appendChild(app.view);

MainMessagePage.run(app);

/* test function, omit for now
app.loader.add('bunny', './img/pekora.json').load((loader, resources) => {
    // This creates a texture from a 'bunny.png' image
    const frames = [];
    
    for (let i = 0; i < 10; i++){
        const texture = PIXI.Texture.from(`pekora${i}.png`);
        frames.push(texture);
    }

    const bunny = new PIXI.AnimatedSprite(frames);

    // Setup the position of the bunny
    bunny.x = app.renderer.width / 2;
    bunny.y = app.renderer.height / 2;

    // Rotate around the center
    bunny.anchor.x = 0.5;
    bunny.anchor.y = 0.5;
    bunny.animationSpeed = .2;
    bunny.play();

    // Add the bunny to the scene we are building
    app.stage.addChild(bunny);

    // Listen for frame updates
    app.ticker.add(() => {
        bunny.x = app.renderer.width / 2;
        bunny.y = app.renderer.height / 2;

         // each frame we spin the bunny around a bit
        bunny.rotation -= 0.01;
    });
});
*/