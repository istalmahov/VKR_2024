import { forwardRef, useImperativeHandle, useRef } from "react";
import { drawFFT } from "../fft";

export type FFTRef = {
  draw(samples: Float32Array): void;
};

export const AnimatedFFT = forwardRef((_props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useImperativeHandle<unknown, FFTRef>(ref, () => ({
    draw(samples: Float32Array) {
      if (!canvasRef.current) {
        return;
      }

      drawFFT(canvasRef.current, samples);
    },
  }));

  return <canvas className="fft" ref={canvasRef}></canvas>;
});
