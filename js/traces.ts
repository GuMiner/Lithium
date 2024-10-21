import { GPUHelper } from "./traces/utility";

var canvasDiv = null;

// The best WebGPU source I've found is https://math.hws.edu/graphicsbook/

interface Program {
    vertexBuffer: GPUBuffer;
    vertexCount: number;
    uniformBuffer: GPUBuffer;
    uniformBindGroup: GPUBindGroup;
    pipeline: GPURenderPipeline;
}

class GridProgram implements Program {
    shader: GPUShaderModule;
    
    vertexBuffer: GPUBuffer;
    vertexCount: number;
    uniformBuffer: GPUBuffer;
    uniformBindGroup: GPUBindGroup;
    pipeline: GPURenderPipeline;

    // This structure is because TypeScript does not allow async constructors.
    protected constructor(shader: GPUShaderModule) {
        this.shader = shader;

        // TODO -- these belong in a subclass, somehow.
        this.uniformBuffer = device.createBuffer({
            size: 3 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        let uniformFragmentLayout: GPUBindGroupLayoutEntry = {
            binding: 0,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: { type: "uniform" }
        };
        let uniformBindGroupLayout = device.createBindGroupLayout({ entries: [uniformFragmentLayout] });

        // vec3f(4-byte) color
        this.uniformBindGroup = device.createBindGroup({
            layout: uniformBindGroupLayout,
            entries: [{
                binding: 0,
                resource: { buffer: this.uniformBuffer, offset: 0, size: 3 * 4 }
                }
            ]
        });

        const vertexCoords = new Float32Array([   // 2D coords for drawing a triangle.
            -0.8, -0.6, 0.8, -0.6, 0, 0.7
        ]); // X-1=Left, X+1=Right, Y-1=Bottom, Y+1=Top
    
        this.vertexBuffer = device.createBuffer({
            size: vertexCoords.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });
    
        device.queue.writeBuffer(this.vertexBuffer, 0, vertexCoords);
        this.vertexCount = 3;
        
        let vertexBufferLayout: GPUVertexBufferLayout[] = [ // An array of vertex buffer specifications.
        {
            attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" } as GPUVertexAttribute],
            arrayStride: 8,
            stepMode: "vertex"
        }];
    
        
        let gpuPipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [uniformBindGroupLayout] });
        let pipelineDescriptor: GPURenderPipelineDescriptor = {
            vertex: { // Configuration for the vertex shader.
                module: this.shader,
                entryPoint: "vertexMain",
                buffers: vertexBufferLayout
            },
            fragment: { // Configuration for the fragment shader.
                module: this.shader,
                entryPoint: "fragmentMain",
                targets: [{
                    format: navigator.gpu.getPreferredCanvasFormat()
                }]
            },
            primitive: {
                topology: "triangle-list"
            },
            layout: gpuPipelineLayout
        };
        
        this.pipeline = device.createRenderPipeline(pipelineDescriptor);
    }

    static async new(shaderUri: string): Promise<GridProgram> {
        return new GridProgram(await GPUHelper.loadShader(device, shaderUri));
    }
}

class TriangleProgram implements Program {
    shader: GPUShaderModule;
    
    vertexBuffer: GPUBuffer;
    vertexCount: number;
    uniformBuffer: GPUBuffer;
    uniformBindGroup: GPUBindGroup;
    pipeline: GPURenderPipeline;

    // This structure is because TypeScript does not allow async constructors.
    protected constructor(shader: GPUShaderModule) {
        this.shader = shader;

        // TODO -- these belong in a subclass, somehow.
        this.uniformBuffer = device.createBuffer({
            size: 3 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        let uniformFragmentLayout: GPUBindGroupLayoutEntry = {
            binding: 0,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: { type: "uniform" }
        };
        let uniformBindGroupLayout = device.createBindGroupLayout({ entries: [uniformFragmentLayout] });

        // vec3f(4-byte) color
        this.uniformBindGroup = device.createBindGroup({
            layout: uniformBindGroupLayout,
            entries: [{
                binding: 0,
                resource: { buffer: this.uniformBuffer, offset: 0, size: 3 * 4 }
                }
            ]
        });

        const vertexCoords = new Float32Array([   // 2D coords for drawing a triangle.
            -0.8, -0.6, 0.8, -0.6, 0, 0.7
        ]); // X-1=Left, X+1=Right, Y-1=Bottom, Y+1=Top
    
        this.vertexBuffer = device.createBuffer({
            size: vertexCoords.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });
    
        device.queue.writeBuffer(this.vertexBuffer, 0, vertexCoords);
        this.vertexCount = 3;
        
        let vertexBufferLayout: GPUVertexBufferLayout[] = [ // An array of vertex buffer specifications.
        {
            attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" } as GPUVertexAttribute],
            arrayStride: 8,
            stepMode: "vertex"
        }];
    
        
        let gpuPipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [uniformBindGroupLayout] });
        let pipelineDescriptor: GPURenderPipelineDescriptor = {
            vertex: { // Configuration for the vertex shader.
                module: this.shader,
                entryPoint: "vertexMain",
                buffers: vertexBufferLayout
            },
            fragment: { // Configuration for the fragment shader.
                module: this.shader,
                entryPoint: "fragmentMain",
                targets: [{
                    format: navigator.gpu.getPreferredCanvasFormat()
                }]
            },
            primitive: {
                topology: "triangle-list"
            },
            layout: gpuPipelineLayout
        };
        
        this.pipeline = device.createRenderPipeline(pipelineDescriptor);
    }

    static async new(shaderUri: string): Promise<TriangleProgram> {
        return new TriangleProgram(await GPUHelper.loadShader(device, shaderUri));
    }
}

let triangleProgram: TriangleProgram;
let gridProgram: GridProgram;

let device: GPUDevice;
let context: GPUCanvasContext;

async function initDeviceAndContext(canvas): Promise<boolean> {
    device = await GPUHelper.getWebGPUDevice(canvas);
    if (device == null) {
        return false;
    }

    context = canvas.getContext("webgpu");
    context.configure({
        device: device,
        format: navigator.gpu.getPreferredCanvasFormat(),
        alphaMode: "premultiplied",
    });

    return true;
}

async function initWebGPU(canvas): Promise<boolean> {
    if (!await initDeviceAndContext(canvas)) {
        return false;
    }

    // Just some samples to get off of the ground
    triangleProgram = await TriangleProgram.new("/static/game/gpu/triangle.wgsl");
    gridProgram = await GridProgram.new("/static/game/gpu/grid.wgsl");

    return true;
}


function enterFullscreen() {
    // Fullscreen requests can only be made if triggered by a user.
    // As such, we need to do this call in a function triggered by a button press.
    // canvasDiv.requestFullscreen();
    // globalEngine.switchFullscreen(false);
    //globalEngine.resize(true);
}

(window as any).enterFullscreen = enterFullscreen;

let previousTime = null;

window.addEventListener('load', async () => {
    // Setup the screen
    canvasDiv = document.getElementById("canvasDiv");
    var canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.id = "tracesCanvas";
    canvasDiv.appendChild(canvas);

    // Need to resize before 2D error rendering, as resizing clears the canvas
    let cssWidth = window.getComputedStyle(canvas, null).getPropertyValue("width");
    let cssHeight = window.getComputedStyle(canvas, null).getPropertyValue("height");
    canvas.setAttribute('width', cssWidth);
    canvas.setAttribute('height', cssHeight);
    console.log(`${cssWidth}x${cssHeight}`)

    if (await initWebGPU(canvas)) {
        previousTime = performance.now();
        requestAnimationFrame(renderFrame);
    }
});

function renderFrame() {
    let now = performance.now();
    let timeDelta = (now - previousTime) / 1000; 
    previousTime = now;

    let commandEncoder = device.createCommandEncoder();
    let passEncoder = commandEncoder.beginRenderPass(GPUHelper.createRenderPassDescriptor(context));

    var program: Program;
    if (mode == 2) {
        program = triangleProgram;
        
        device.queue.writeBuffer(program.uniformBuffer, 0, new Float32Array([Math.random(), 0.5, 0.8]));
    } else if (mode == 1) {
        program = gridProgram;
    }

    // Just like OpenGL, attach everything listed for drawing.
    passEncoder.setPipeline(program.pipeline);
    passEncoder.setVertexBuffer(0, program.vertexBuffer);
    passEncoder.setBindGroup(0, program.uniformBindGroup);
    passEncoder.draw(program.vertexCount);
    passEncoder.end();

    let commandBuffer = commandEncoder.finish();
    device.queue.submit([commandBuffer]);

    requestAnimationFrame(renderFrame);
}

window.addEventListener("resize", () => {
    let canvas = document.getElementById("tracesCanvas");
    let cssWidth = window.getComputedStyle(canvas, null).getPropertyValue("width");
    let cssHeight = window.getComputedStyle(canvas, null).getPropertyValue("height");
    // canvas.setAttribute('width', cssWidth);
    // canvas.setAttribute('height', cssHeight);
    // console.log(`${cssWidth}x${cssHeight}`)
});

var mode = 2;
window.addEventListener('keyup', (ev) => {
    console.log(`${ev.code} ${ev.key}`);
});

window.addEventListener('keydown', (ev) => {
    console.log(`${ev.code} ${ev.key}`);
    if (ev.key == "2") {
        mode = 2;
    } else if (ev.key == "1") {
        mode = 1;
    }
}); 