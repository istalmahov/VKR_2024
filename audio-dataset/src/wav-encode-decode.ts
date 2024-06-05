import { readFile, writeFile } from "fs/promises";
import { Note } from "@tonejs/midi/dist/Note";
import { decoders } from "audio-decode";
import { encode } from "wav-encoder";

export function generateWav(notes: Note[][], samples: []) {}

export async function loadWav(path: string) {
  const file = await readFile(path);

  const audio = await decoders.wav(file);

  return audio;
}

export async function saveWav(channelData: Float32Array[], sampleRate: number, path: string) {
  const wavTrack = await encode({ sampleRate, channelData });

  return writeFile(path, Buffer.from(wavTrack));
}

export async function saveAudioBuffer(audio: AudioBuffer, path: string) {
  const channels: Float32Array[] = [];

  for (let channel = 0; channel < audio.numberOfChannels; channel++) {
    channels.push(audio.getChannelData(channel));
  }

  return saveWav(channels, audio.sampleRate, path);
}
