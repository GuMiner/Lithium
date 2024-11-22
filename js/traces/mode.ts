export enum Mode {
    Grid = 1,
    Triangle = 2
}

export var GlobalMode: Mode = Mode.Grid;


window.addEventListener('keyup', (ev) => {
    console.log(`${ev.code} ${ev.key}`);
});

window.addEventListener('keydown', (ev) => {
    console.log(`${ev.code} ${ev.key}`);
    if (ev.key == "2") {
        GlobalMode = Mode.Triangle;
    } else if (ev.key == "1") {
        GlobalMode = Mode.Grid;
    }
});

(window as any).triangleMode = triangleMode;
(window as any).simMode = simMode;

function triangleMode() {
    GlobalMode = Mode.Triangle;
}

function simMode() {
    GlobalMode = Mode.Grid;
}
