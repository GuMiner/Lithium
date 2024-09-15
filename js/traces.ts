var canvasDiv = null;

// The best WebGPU source I've found is https://math.hws.edu/graphicsbook/

function renderErrorMessage(canvas, ...errorMessages: String[]) {
    const context = canvas.getContext("2d");

    context.font = "20px Helvetica";
    let yOffset = 40;
    for (let errorMessage of errorMessages) {
        context.fillText(errorMessage, 10, yOffset);
        yOffset = yOffset + 28;
    }
}

async function initWebGPU(canvas): Promise<boolean> {
    if (!navigator.gpu) {
        renderErrorMessage(canvas, "WebGPU is not supported in this browser.",
            "If on Firefox, enable WebGPU by:",
            " - Navigating to 'about:config'",
            " - Enabling 'dom.webgpu.enabled'"
        );
        return false;
    }

    let adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        renderErrorMessage(canvas, "WebGPU is supported, but this app was unable to get the WebGPU adapter.");
        return false;
    }

    let device = await adapter.requestDevice();

    let context = canvas.getContext("webgpu");
    context.configure({
        device: device,
        format: navigator.gpu.getPreferredCanvasFormat(),
        alphaMode: "premultiplied",
    });

    // Just some samples to get off of the ground
    const shaderSource = ` 
        @group(0) @binding(0) var<uniform> color : vec3f;

        @vertex
        fn vertexMain( @location(0) coords : vec2f ) -> @builtin(position) vec4f {
            return vec4f( coords, 0, 1 );
        }
        
        @fragment
        fn fragmentMain() -> @location(0) vec4f {
            return vec4f( color, 1 ); 
        }
        `;

    device.pushErrorScope("validation");
    let shader = device.createShaderModule({ code: shaderSource });

    let error = await device.popErrorScope();
    if (error) {
        // The WebGPU context is at this point setup, so swapping the context to 2D doesn't work
        throw Error("Compilation error in shader!");
    }

    let vertexBufferLayout: GPUVertexBufferLayout[] = [ // An array of vertex buffer specifications.
    {
        attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" } as GPUVertexAttribute],
        arrayStride: 8,
        stepMode: "vertex"
    }];

    let uniformFragmentLayout: GPUBindGroupLayoutEntry = {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" }
    };
    let uniformBindGroupLayout = device.createBindGroupLayout({ entries: [uniformFragmentLayout] });
    let gpuPipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [uniformBindGroupLayout] });
    let pipelineDescriptor: GPURenderPipelineDescriptor = {
        vertex: { // Configuration for the vertex shader.
            module: shader,
            entryPoint: "vertexMain",
            buffers: vertexBufferLayout
        },
        fragment: { // Configuration for the fragment shader.
            module: shader,
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

    let pipeline = device.createRenderPipeline(pipelineDescriptor);

    let uniformBuffer = device.createBuffer({
        size: 3 * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    let uniformBindGroup = device.createBindGroup({
        layout: uniformBindGroupLayout,
        entries: [
            {
                binding: 0, // Corresponds to the binding 0 in the layout.
                resource: { buffer: uniformBuffer, offset: 0, size: 3 * 4 }
            }
        ]
    });

    const vertexCoords = new Float32Array([   // 2D coords for drawing a triangle.
        -0.8, -0.6, 0.8, -0.6, 0, 0.7
    ]); // X-1=Left, X+1=Right, Y-1=Bottom, Y+1=Top

    let vertexBuffer = device.createBuffer({
        size: vertexCoords.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });

    device.queue.writeBuffer(vertexBuffer, 0, vertexCoords);
    device.queue.writeBuffer(uniformBuffer, 0, new Float32Array([1.0, 0.5, 0.8]));


    let commandEncoder = device.createCommandEncoder();

    let colorAttachment: GPURenderPassColorAttachment = {
        clearValue: { r: 0.5, g: 0.5, b: 0.5, a: 1 },  // gray background
        loadOp: "clear", // Alternative is "load".
        storeOp: "store",  // Alternative is "discard".
        view: context.getCurrentTexture().createView()  // Draw to the canvas.
    };

    let renderPassDescriptor: GPURenderPassDescriptor = { colorAttachments: [colorAttachment] };

    let passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(pipeline);            // Specify pipeline.
    passEncoder.setVertexBuffer(0, vertexBuffer);  // Attach vertex buffer.
    passEncoder.setBindGroup(0, uniformBindGroup); // Attach bind group.
    passEncoder.draw(3);                          // Generate vertices.
    passEncoder.end();


    let commandBuffer = commandEncoder.finish();
    device.queue.submit([commandBuffer]);
}


function enterFullscreen() {
    // Fullscreen requests can only be made if triggered by a user.
    // As such, we need to do this call in a function triggered by a button press.
    // canvasDiv.requestFullscreen();
    // globalEngine.switchFullscreen(false);
    //globalEngine.resize(true);
}

(window as any).enterFullscreen = enterFullscreen;
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
        // Continue
    }
});

window.addEventListener("resize", () => {
    let canvas = document.getElementById("tracesCanvas");
    let cssWidth = window.getComputedStyle(canvas, null).getPropertyValue("width");
    let cssHeight = window.getComputedStyle(canvas, null).getPropertyValue("height");
    // canvas.setAttribute('width', cssWidth);
    // canvas.setAttribute('height', cssHeight);
    // console.log(`${cssWidth}x${cssHeight}`)
});
