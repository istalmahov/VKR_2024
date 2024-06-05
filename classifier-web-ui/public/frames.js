import { WINDOW_LENGTH } from "../src/constants";

class FramedAudio extends AudioWorkletProcessor {
  index = 0;
  buffer = [new Float32Array(WINDOW_LENGTH), new Float32Array(WINDOW_LENGTH)];

  static get parameterDescriptors() {
    return [];
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    for (let channel = 0; channel < output.length; ++channel) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];

      if (!inputChannel?.length) {
        return true;
      }

      const bufferChannel = this.buffer[channel];
      for (let i = 0; i < outputChannel.length; ++i) {
        outputChannel[i] = inputChannel[i];
        bufferChannel[this.index++] = inputChannel[i];

        if (this.index >= bufferChannel.length) {
          this.port.postMessage(this.buffer);
          this.index = 0;
        }
      }
    }

    return true;
  }
}

registerProcessor("framed-audio", FramedAudio);
