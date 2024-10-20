export function renderErrorMessage(canvas, ...errorMessages: String[]) {
    const context = canvas.getContext("2d");

    context.font = "20px Helvetica";
    let yOffset = 40;
    for (let errorMessage of errorMessages) {
        context.fillText(errorMessage, 10, yOffset);
        yOffset = yOffset + 28;
    }
}

export async function getFile(url: string): Promise<string> {
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
        console.error(`HTTP ${response.status} ${await response.text()}`);
        return "";
    }

    return await response.text();
}