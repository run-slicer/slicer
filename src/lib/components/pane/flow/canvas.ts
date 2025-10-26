// @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas#maximum_canvas_size
const canvasDimensionLimit = 32767;
const canvasAreaLimit = 16384 ** 2;

// substitute for the html-to-image dimension check to avoid issues with very large but narrow images
// for modern browsers (2025), the dimension limit is 32767 instead of half that (but area limit remains 16384^2)
export const checkDims = (width: number, height: number): { width: number; height: number } => {
    if (width > canvasDimensionLimit || height > canvasDimensionLimit) {
        if (width > canvasDimensionLimit && height > canvasDimensionLimit) {
            if (width > height) {
                height *= canvasDimensionLimit / width;
                width = canvasDimensionLimit;
            } else {
                width *= canvasDimensionLimit / height;
                height = canvasDimensionLimit;
            }
        } else if (width > canvasDimensionLimit) {
            height *= canvasDimensionLimit / width;
            width = canvasDimensionLimit;
        } else {
            width *= canvasDimensionLimit / height;
            height = canvasDimensionLimit;
        }
    }

    const currentArea = width * height;
    if (currentArea > canvasAreaLimit) {
        const scaleFactor = Math.sqrt(canvasAreaLimit / currentArea);
        width *= scaleFactor;
        height *= scaleFactor;
    }

    return { width, height };
};
