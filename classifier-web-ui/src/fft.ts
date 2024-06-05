function scale(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
) {
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

export function drawFFT(canvas: HTMLCanvasElement, values: Float32Array) {
  const { width, height } = canvas.getBoundingClientRect();

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return;
  }

  const max = Math.max(0.001, ...values) * 1.1;
  const min = Math.min(-0.001, ...values) * 1.1;
  const lineWidth = 3;

  ctx.fillStyle = "gray";
  ctx.lineWidth = lineWidth;
  ctx.fillRect(0, 0, width, height);

  ctx.beginPath();
  ctx.moveTo(0, 0);

  ctx.strokeStyle = "white";

  for (let i = 0; i < values.length; i += 1) {
    const v = values[i];
    const x = scale(i, 0, values.length, lineWidth, width - lineWidth);
    const y = scale(v, max, min, 0, height - lineWidth);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();
  ctx.closePath();
}
