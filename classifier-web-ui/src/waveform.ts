import { CANVAS_LENGTH, FRAME_SIZE } from "./constants";

export function drawWaveform(
  canvas: HTMLCanvasElement,
  waveformState: { drawXPosition: number },
  samples: Float32Array
) {
  const { width, height } = canvas.getBoundingClientRect();

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return;
  }

  const middleHeight = height / 2;
  const xStep = width / CANVAS_LENGTH;

  ctx.fillStyle = "gray";
  ctx.fillRect(waveformState.drawXPosition * xStep, 0, width, height);

  ctx.beginPath();
  ctx.moveTo(waveformState.drawXPosition * xStep, middleHeight);

  ctx.strokeStyle = "white";

  for (let i = 0; i < FRAME_SIZE; i += 4, waveformState.drawXPosition += 1) {
    const sample = samples[i];

    const x = waveformState.drawXPosition * xStep;
    const y = middleHeight + -sample * middleHeight;

    ctx.lineTo(x, y);

    if (waveformState.drawXPosition > CANVAS_LENGTH) {
      waveformState.drawXPosition = 0;
    }
  }

  ctx.stroke();
  ctx.closePath();
}
