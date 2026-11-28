export interface CanvasResolution {
  context: CanvasRenderingContext2D;
  resize: () => void;
  dispose: () => void;
}

/**
 * Keep simulation coordinates independent from CSS size and screen density.
 * Draw using logicalWidth/logicalHeight, never canvas.width/canvas.height.
 * Resize only the drawing buffer; the caller's game state and RAF loop survive.
 * CSS should constrain the canvas width. Drawing styles must be set each frame,
 * because resizing a canvas resets the browser's context state.
 */
export function createCanvasResolution(
  canvas: HTMLCanvasElement,
  logicalWidth: number,
  logicalHeight: number,
  maxPixelRatio = 3,
): CanvasResolution | null {
  const context = canvas.getContext("2d");
  if (!context) return null;
  canvas.style.aspectRatio = `${logicalWidth} / ${logicalHeight}`;
  let disposed = false;
  let densityQuery: MediaQueryList | undefined;
  let lastDensity = 0;

  function watchDensity() {
    const density = window.devicePixelRatio || 1;
    if (density === lastDensity) return;
    densityQuery?.removeEventListener("change", resize);
    densityQuery = window.matchMedia(`(resolution: ${density}dppx)`);
    densityQuery.addEventListener("change", resize);
    lastDensity = density;
  }

  function resize() {
    if (disposed) return;
    const rect = canvas.getBoundingClientRect();
    const cssWidth = rect.width || logicalWidth;
    const cssHeight = rect.height || (cssWidth * logicalHeight) / logicalWidth;
    const density = Math.max(
      1,
      Math.min(window.devicePixelRatio || 1, maxPixelRatio),
    );
    // Limit the buffer on very large displays without changing logical gameplay.
    const scale = Math.min(
      density,
      Math.sqrt(4_000_000 / (cssWidth * cssHeight)),
    );
    const width = Math.max(1, Math.round(cssWidth * scale));
    const height = Math.max(1, Math.round(cssHeight * scale));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      context!.setTransform(
        width / logicalWidth,
        0,
        0,
        height / logicalHeight,
        0,
        0,
      );
    }
    watchDensity();
  }

  // Establish the transform even if the default canvas size already matches.
  context.setTransform(
    canvas.width / logicalWidth,
    0,
    0,
    canvas.height / logicalHeight,
    0,
    0,
  );
  resize();
  const observer =
    typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
  observer?.observe(canvas);
  window.addEventListener("resize", resize);
  return {
    context,
    resize,
    dispose() {
      disposed = true;
      observer?.disconnect();
      densityQuery?.removeEventListener("change", resize);
      window.removeEventListener("resize", resize);
    },
  };
}
