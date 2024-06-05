import { forwardRef, useImperativeHandle, useRef } from "react";
import { drawWaveform } from "../waveform";

export type WaveformRef = {
  draw(samples: Float32Array): void;
};

export const AnimatedWaveform = forwardRef((_props, ref) => {
  const canvasState = useRef({
    drawXPosition: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useImperativeHandle<unknown, WaveformRef>(ref, () => ({
    draw(samples: Float32Array) {
      if (!canvasRef.current) {
        return;
      }

      drawWaveform(canvasRef.current, canvasState.current, samples);
    },
  }));

  return <canvas className="waveform" ref={canvasRef}></canvas>;
});
