import { saveWav } from "./wav-encode-decode.ts";

export class Track {
  private channels: Float32Array[] = [];

  constructor(public readonly samplerate: number, public readonly length: number) {
    this.initializeChannels(length);
  }

  public merge(audio: AudioBuffer, position: number, gain: number = 1) {
    if (audio.numberOfChannels > 2) {
      throw new Error("Track does not support more than 2 channels");
    }

    let fromChannels: Float32Array[] = [];

    if (audio.numberOfChannels === 1) {
      const monoChannel = audio.getChannelData(0);
      fromChannels.push(monoChannel, monoChannel);
    } else {
      fromChannels.push(audio.getChannelData(0), audio.getChannelData(1));
    }

    for (let i = 0; i <= audio.length && i <= this.length - position; i++) {
      this.channels[0][position + i] += fromChannels[0][i] * gain;
      this.channels[1][position + i] += fromChannels[1][i] * gain;
    }
  }

  public async saveFile(path: string) {
    return saveWav(this.channels, this.samplerate, path);
  }

  private initializeChannels(length: number) {
    this.channels.push(new Float32Array(length), new Float32Array(length));
  }
}
