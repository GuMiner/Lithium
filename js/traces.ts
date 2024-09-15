


var canvasDiv = null;

function enterFullscreen() {
    // Fullscreen requests can only be made if triggered by a user.
    // As such, we need to do this call in a function triggered by a button press.
    // canvasDiv.requestFullscreen();
   // globalEngine.switchFullscreen(false);
    //globalEngine.resize(true);
}

(window as any).enterFullscreen = enterFullscreen;
window.addEventListener('load', () =>
{
    // Setup the screen
    canvasDiv = document.getElementById("canvasDiv");
    var canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.id = "tracesCanvas";
    canvasDiv.appendChild(canvas);
});

window.addEventListener("resize", () => {
    // globalEngine.resize(true);
});
