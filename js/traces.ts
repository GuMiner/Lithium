import { GPUHelper } from "./traces/utility";

var canvasDiv: HTMLDivElement = null;
var canvas: HTMLCanvasElement = null;

interface Program {
    vertexBuffer: GPUBuffer;
    vertexCount: number;
    uniformBuffer: GPUBuffer;

    // Must be ordered in the order they are used in the shader.
    bindGroups: GPUBindGroup[];
    pipeline: GPURenderPipeline;
}

class GridProgram implements Program {
    shader: GPUShaderModule;
    
    vertexBuffer: GPUBuffer;
    vertexCount: number;

    uniformBuffer: GPUBuffer;
    uniformBindGroup: GPUBindGroup;

    gridBuffer: GPUBuffer;
    gridBufferBindGroup: GPUBindGroup;

    bindGroups: GPUBindGroup[];

    pipeline: GPURenderPipeline;

    readonly simWidth = 320;
    readonly simHeight = 240;

    // This structure is because TypeScript does not allow async constructors.
    protected constructor(shader: GPUShaderModule) {
        this.shader = shader;

        // Viewport size
        this.uniformBuffer = device.createBuffer({
            label: "ViewportBuffer",
            size: 2 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // grid data
        this.gridBuffer = device.createBuffer({
            label: "GridBuffer",
            size: 4*this.simWidth*this.simHeight,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });

        let uniformFragmentLayout: GPUBindGroupLayoutEntry = {
            binding: 0,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: { type: "uniform" }
        };
        let uniformBindGroupLayout = device.createBindGroupLayout({ entries: [uniformFragmentLayout] });

        // vec3f(4-byte) color
        this.uniformBindGroup = device.createBindGroup({
            label: "UniformBindGroup",
            layout: uniformBindGroupLayout,
            entries: [{
                binding: 0,
                resource: { buffer: this.uniformBuffer, offset: 0, size: 2 * 4 }
                }
            ]
        });

        let storageFragmentLayout: GPUBindGroupLayoutEntry = {
            binding: 0,
            visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
            buffer: { type: "storage" }
        };
        let gridBufferBindGroupLayout = device.createBindGroupLayout({ entries: [storageFragmentLayout] });

        // vec3f(4-byte) color
        this.gridBufferBindGroup = device.createBindGroup({
            label: "GridBufferBindGroup",
            layout: gridBufferBindGroupLayout,
            entries: [{
                binding: 0,
                resource: { buffer: this.gridBuffer, offset: 0, size: 4*this.simWidth*this.simHeight }
            }
            ]
        });

        this.bindGroups = [this.gridBufferBindGroup, this.uniformBindGroup];

        this.populateGridBuffer(device);

        // Cor
        const vertexCoords = new Float32Array([   // 2D coords for drawing a triangle.
            -1,-1, 1,-1, 1,1,
            -1,-1, 1,1, -1,1
        ]); // X-1=Left, X+1=Right, Y-1=Bottom, Y+1=Top
    
        this.vertexBuffer = device.createBuffer({
            size: vertexCoords.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });
    
        device.queue.writeBuffer(this.vertexBuffer, 0, vertexCoords);
        this.vertexCount = vertexCoords.length / 2;
        
        let vertexBufferLayout: GPUVertexBufferLayout[] = [ // An array of vertex buffer specifications.
        {
            attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" } as GPUVertexAttribute],
            arrayStride: 8,
            stepMode: "vertex"
        }];
    
        
        let gpuPipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [gridBufferBindGroupLayout, uniformBindGroupLayout] });
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

    populateGridBuffer(device: GPUDevice) {
        // Put the starting values into the buffer
        let colorData = new Uint32Array(this.simWidth*this.simHeight);
        let counter = 0;

        // Temporarily fill with a repeating pattern
        for (let i = 0; i < this.simWidth * this.simHeight; i++) {
            colorData[i] = counter;
            counter++;
            if (counter > 5) {
                counter = 0;
            }
        }

        device.queue.writeBuffer(this.gridBuffer, 0, colorData);
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
    bindGroups: GPUBindGroup[];
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

        this.bindGroups = [this.uniformBindGroup];

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
    canvasDiv = document.getElementById("canvasDiv") as HTMLDivElement;
    canvas = document.createElement("canvas");
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

        device.queue.writeBuffer(program.uniformBuffer, 0, new Float32Array([canvas.clientWidth, canvas.clientHeight]));
    }

    // Just like OpenGL, attach everything listed for drawing.
    passEncoder.setPipeline(program.pipeline);
    passEncoder.setVertexBuffer(0, program.vertexBuffer);
    for (let i = 0; i < program.bindGroups.length; i++) {
        passEncoder.setBindGroup(i, program.bindGroups[i]);
    }
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