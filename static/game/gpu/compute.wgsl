// White-to-black color scale
const colors = array<vec4f, 6>(
    vec4f(1.0, 1.0, 1.0, 1.0),
    vec4f(0.8, 0.8, 0.8, 1.0),
    vec4f(0.6, 0.6, 0.6, 1.0),
    vec4f(0.4, 0.4, 0.4, 1.0),
    vec4f(0.2, 0.2, 0.2, 1.0),
    vec4f(0.0, 0.0, 0.0, 1.0));

const simWidth = 320u;
const simHeight = 240u;


// Index into colors for the simulation
@group(0) @binding(0) var<storage,read_write> gridDataPing : array<u32, simWidth*simHeight>;
@group(0) @binding(1) var<storage,read_write> gridDataPong : array<u32, simWidth*simHeight>;
@group(0) @binding(2) var<uniform> pingPong: vec2u;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id : vec3u) {
    let cell = id.xy;
    if (cell.x >= simWidth || cell.y >= simHeight) {
        return;
    }

    let index = cell.x + cell.y * simWidth;

    // TODO figure out how to properly use array pointers in Web GPU
    if (pingPong.x > 0)
    {
        let readValue = gridDataPing[index];
        gridDataPong[index] = (readValue + gridDataPing[index - 10] + gridDataPing[index + 3]) % 6;
    } else {
        let readValue = gridDataPong[index];
        gridDataPing[index] = (readValue + gridDataPong[index - 10] + gridDataPong[index + 3]) % 6;
    }
}