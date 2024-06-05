import { useCallback, useEffect, useRef, useState } from "react";

import { WEBSOCKET_URL } from "./constants";
import { AnimatedWaveform, WaveformRef } from "./components/animated-waveform";
import { createWebSocket } from "./websocket";
import Knob from "./components/knob";

import "./App.css";
import { setupAudio } from "./audio";

const {
  inputVolumeNode,
  outputVolumeNode,
  inputWaveformNode,
  outputWaveformNode,
  players,
  port,
} = await setupAudio(true);

const webSocket = createWebSocket(WEBSOCKET_URL, port);

function App() {
  const inputWaveformRef = useRef<WaveformRef>(null);
  const outputWaveformRef = useRef<WaveformRef>(null);
  const requestRef = useRef<number>();

  const [inputVolume, setInputVolume] = useState(1);
  const [outputVolume, setOutputVolume] = useState(1);

  const [kickSensitivity, setKickSensitivity] = useState(0.5);
  const [snareSensitivity, setSnareSensitivity] = useState(0.5);
  const [hihatSensitivity, setHihatSensitivity] = useState(0.5);

  const onMessage = useCallback(
    (e: MessageEvent<string>) => {
      const data = JSON.parse(e.data);

      if (data[1] > 1 - kickSensitivity) {
        players?.kick.start();
      }

      if (data[2] > 1 - snareSensitivity) {
        players?.snare.start();
      }

      if (data[3] > 1 - hihatSensitivity) {
        players?.hihat.start();
      }
    },
    [hihatSensitivity, kickSensitivity, snareSensitivity]
  );

  useEffect(() => {
    webSocket.onmessage = onMessage;
  }, [onMessage]);

  useEffect(() => {
    inputVolumeNode.set({ volume: inputVolume });
  }, [inputVolume]);

  useEffect(() => {
    outputVolumeNode.set({ volume: outputVolume });
  }, [outputVolume]);

  const animationLoop = useCallback(() => {
    requestRef.current = requestAnimationFrame(animationLoop);

    if (!inputWaveformRef.current) {
      return;
    }

    const samples = inputWaveformNode.getValue();

    outputWaveformRef.current?.draw(outputWaveformNode.getValue());

    inputWaveformRef.current.draw(samples);
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animationLoop);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [animationLoop]);

  return (
    <>
      <div>
        <Knob min={-96} max={0} value={inputVolume} onChange={setInputVolume} />
        <span style={{ paddingLeft: "0.5rem" }}>Громкость микрофона</span>
      </div>
      <AnimatedWaveform ref={inputWaveformRef} />
      <div>
        <Knob
          min={-96}
          max={0}
          value={outputVolume}
          onChange={setOutputVolume}
        />
        <span style={{ paddingLeft: "0.5rem" }}>
          Громкость синтезированного аудио
        </span>
      </div>
      <AnimatedWaveform ref={outputWaveformRef} />
      <p>Настройки чувствительности</p>
      <div style={{ display: "flex", flexDirection: "row", gap: "1rem" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          <Knob
            min={0}
            max={1}
            value={kickSensitivity}
            onChange={setKickSensitivity}
          />
          <span>Kick {kickSensitivity.toFixed(2)}</span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          <Knob
            min={0}
            max={1}
            value={snareSensitivity}
            onChange={setSnareSensitivity}
          />
          <span>Snare {snareSensitivity.toFixed(2)}</span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          <Knob
            min={0}
            max={1}
            value={hihatSensitivity}
            onChange={setHihatSensitivity}
          />
          <span>Hihat {hihatSensitivity.toFixed(2)}</span>
        </div>
      </div>
    </>
  );
}

export default App;
