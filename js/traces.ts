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
    computeShader: GPUShaderModule;
    
    vertexBuffer: GPUBuffer;
    vertexCount: number;

    uniformBuffer: GPUBuffer;
    uniformBindGroup: GPUBindGroup;

    pingPongBuffer: GPUBuffer;

    gridBufferPing: GPUBuffer;
    gridBufferPong: GPUBuffer;
    gridBufferBindGroup: GPUBindGroup;

    bindGroups: GPUBindGroup[];

    pipeline: GPURenderPipeline;

    computePipeline: GPUComputePipeline;
    computeBindGroup: GPUBindGroup;
    computeWorkgroupsX: number;
    computeWorkgroupsY: number;

    readonly simWidth = 320;
    readonly simHeight = 240;

    // This structure is because TypeScript does not allow async constructors.
    protected constructor(shader: GPUShaderModule, computeShader: GPUShaderModule) {
        this.shader = shader;
        this.computeShader = computeShader;

        // Viewport size
        this.uniformBuffer = device.createBuffer({
            label: "ViewportBuffer",
            size: 2 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.pingPongBuffer = device.createBuffer({
            label: "PingPongBuffer",
            size: 2 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // grid data
        this.gridBufferPing = device.createBuffer({
            label: "GridBuffer",
            size: 4*this.simWidth*this.simHeight,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
        this.gridBufferPong = device.createBuffer({
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
                },
            ]
        });

        let storageFragmentLayout: GPUBindGroupLayoutEntry = {
            binding: 0,
            visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
            buffer: { type: "storage" },
        };
        let storageFragmentLayout2: GPUBindGroupLayoutEntry = {
            binding: 1,
            visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
            buffer: { type: "storage" },
        };
        let uniformFragmentLayout2: GPUBindGroupLayoutEntry = {
            binding: 2,
            visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
            buffer: { type: "uniform" }
        };
        let gridBufferBindGroupLayout = device.createBindGroupLayout({ entries: [storageFragmentLayout,storageFragmentLayout2,uniformFragmentLayout2] });

        // vec3f(4-byte) color
        this.gridBufferBindGroup = device.createBindGroup({
            label: "GridBufferBindGroup",
            layout: gridBufferBindGroupLayout,
            entries: [{
                binding: 0,
                resource: { buffer: this.gridBufferPing, offset: 0, size: 4*this.simWidth*this.simHeight }
            },
            {
                binding: 1,
                resource: { buffer: this.gridBufferPong, offset: 0, size: 4*this.simWidth*this.simHeight }
            },
            {
                binding: 2,
                resource: { buffer: this.pingPongBuffer, offset: 0, size: 2 * 4 }
            },
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

        let computePipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [gridBufferBindGroupLayout] }); // Fragment shader reuse
        let computePipelineDescriptor = {
            compute: {
               module: computeShader,
               entryPoint: "main"
            },
            layout: computePipelineLayout
        };
         
        this.computePipeline = device.createComputePipeline(computePipelineDescriptor);
        
        // Reuse with the fragment shader
        this.computeBindGroup = this.gridBufferBindGroup;

        this.computeWorkgroupsX = this.simWidth / 8;
        this.computeWorkgroupsY = this.simHeight / 8;
    }

    populateGridBuffer(device: GPUDevice) {
        // Put the starting values into the buffer
        let colorData = new Uint32Array(this.simWidth*this.simHeight);
        let counter = 0;

        // Temporarily fill with a repeating pattern
        for (let i = 0; i < this.simWidth * this.simHeight; i++) {
            colorData[i] = counter;
            let x = i % this.simWidth;
            let y = Math.floor(i / this.simWidth);
            if (x == 0 || y == 0 || x == this.simWidth - 1 || y == this.simHeight - 1) {
                colorData[i] = 5;
            }

            counter++;
            if (counter > 5) {
                counter = 0;
            }
        }

        device.queue.writeBuffer(this.gridBufferPing, 0, colorData);
        device.queue.writeBuffer(this.gridBufferPong, 0, colorData);
    }

    static async new(shaderUri: string, computeShaderUri: string): Promise<GridProgram> {
        return new GridProgram(await GPUHelper.loadShader(device, shaderUri), await GPUHelper.loadShader(device, computeShaderUri));
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
    gridProgram = await GridProgram.new("/static/game/gpu/grid.wgsl", "/static/game/gpu/compute.wgsl");

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
(window as any).triangleMode = triangleMode;
(window as any).simMode = simMode;

let previousTime = null;

window.addEventListener('load', async () => {
    // Setup the screen
    canvasDiv = document.getElementById("canvasDiv") as HTMLDivElement;
    canvas = document.createElement("canvas") as HTMLCanvasElement;
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

var pingPong = 0;
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

        device.queue.writeBuffer(program.uniformBuffer, 0, new Float32Array([canvas.width, canvas.height]));
        device.queue.writeBuffer((program as GridProgram).pingPongBuffer, 0, new Uint32Array([pingPong, pingPong]));
        if (pingPong == 0) {
            pingPong = 1;
        } else {
            pingPong = 0;
        }
    }

    // Just like OpenGL, attach everything listed for drawing.

    passEncoder.setViewport(0, 0, canvas.width, canvas.height, 0, 1);
    passEncoder.setPipeline(program.pipeline);
    passEncoder.setVertexBuffer(0, program.vertexBuffer);
    for (let i = 0; i < program.bindGroups.length; i++) {
        passEncoder.setBindGroup(i, program.bindGroups[i]);
    }
    passEncoder.draw(program.vertexCount);
    passEncoder.end();

    if (mode == 1) {
        let computePassEncoder = commandEncoder.beginComputePass();
        computePassEncoder.setPipeline((program as GridProgram).computePipeline);
        computePassEncoder.setBindGroup(0, (program as GridProgram).computeBindGroup);
        computePassEncoder.dispatchWorkgroups((program as GridProgram).computeWorkgroupsX, (program as GridProgram).computeWorkgroupsY);
        computePassEncoder.end();
    }

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

var mode = 1;
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

function triangleMode() {
    mode = 2;
}

function simMode() {
    mode = 1;
}