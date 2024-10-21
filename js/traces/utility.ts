function renderErrorMessage(canvas, ...errorMessages: String[]) {
    const context = canvas.getContext("2d");

    context.font = "20px Helvetica";
    let yOffset = 40;
    for (let errorMessage of errorMessages) {
        context.fillText(errorMessage, 10, yOffset);
        yOffset = yOffset + 28;
    }
}

async function getFile(url: string): Promise<string> {
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
        console.error(`HTTP ${response.status} ${await response.text()}`);
        return "";
    }

    return await response.text();
}

export namespace GPUHelper {
    export async function getWebGPUDevice(canvas): Promise<GPUDevice> {
        if (!navigator.gpu) {
            renderErrorMessage(canvas, "WebGPU is not supported in this browser.",
                "If on Firefox, enable WebGPU by:",
                " - Navigating to 'about:config'",
                " - Enabling 'dom.webgpu.enabled'"
            );
            return null;
        }
    
        let adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            renderErrorMessage(canvas, "WebGPU is supported, but this app was unable to get the WebGPU adapter.");
            return null;
        }
        
        let device = await adapter.requestDevice();
        return device;
    }

    export async function loadShader(device: GPUDevice, shaderUri: string): Promise<GPUShaderModule> {
        const shaderSource = await getFile(shaderUri);

        device.pushErrorScope("validation");
        const shader = device.createShaderModule({ code: shaderSource });
    
        let error = await device.popErrorScope();
        if (error) {
            // The WebGPU context is at this point setup, so swapping the context to 2D doesn't work
            throw Error("Compilation error in shader!");
        }
        
        return shader;
    }

    export function createRenderPassDescriptor(context: GPUCanvasContext): GPURenderPassDescriptor {
        let colorAttachment: GPURenderPassColorAttachment = {
            clearValue: { r: 0.5, g: 0.5, b: 0.5, a: 1 },  // gray background
            loadOp: "clear", // Alternative is "load".
            storeOp: "store",  // Alternative is "discard".
            view: context.getCurrentTexture().createView()  // Draw to the canvas.
        };

        return { colorAttachments: [colorAttachment] };
    }
}