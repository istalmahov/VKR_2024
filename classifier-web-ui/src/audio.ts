import {
  Player,
  ToneAudioNode,
  UserMedia,
  Volume,
  Waveform,
  Channel,
  getContext,
} from "tone";
import { FRAME_SIZE } from "./constants";

export function getMicrophone() {
  const mic = new UserMedia();

  mic.open();

  return mic;
}

export function setupVolumeAndWaveform(input: ToneAudioNode) {
  const volumeNode = new Volume(-12);
  const waveformNode = new Waveform(FRAME_SIZE);

  input.connect(volumeNode);
  input.connect(waveformNode);

  volumeNode.toDestination();

  return { volumeNode, waveformNode };
}

export function getPlayers() {
  const kick = new Player({
    url: "./kick.wav",
    loop: false,
  });

  const snare = new Player({
    url: "./snare.wav",
    loop: false,
  });

  const hihat = new Player({
    url: "./hihat.wav",
    loop: false,
  });

  const channel = new Channel();

  kick.connect(channel);
  snare.connect(channel);
  hihat.connect(channel);

  return { kick, snare, hihat, channel };
}

export async function setupAudio(test = false) {
  const context = getContext();

  await context.addAudioWorkletModule("./frames.js", "framed-audio");

  const framedAudioNode = getContext().createAudioWorkletNode("framed-audio");

  const testPlayer = new Player("./audio.wav");
  const inputSource = test ? testPlayer : getMicrophone();
  const players = getPlayers();

  const input = setupVolumeAndWaveform(inputSource);
  const output = setupVolumeAndWaveform(players.channel);

  inputSource.connect(framedAudioNode);

  if (test) {
    testPlayer.loop = true;
    testPlayer.autostart = true;
  }

  return {
    inputVolumeNode: input.volumeNode,
    inputWaveformNode: input.waveformNode,
    outputVolumeNode: output.volumeNode,
    outputWaveformNode: output.waveformNode,
    port: framedAudioNode.port,
    players,
  };
}
