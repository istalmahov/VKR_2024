import { mkdir, readdir, rm, writeFile } from "fs/promises";
import { balanceMidi, parseMidi } from "./midi-parser.ts";
import { loadSamples } from "./sample-loader.ts";
import { Track } from "./track.ts";
import { loadWav, saveAudioBuffer, saveWav } from "./wav-encode-decode.ts";
import { join } from "path";
import { SampleManager } from "./sample-manager.ts";
import { existsSync } from "fs";
import { randomSplitArray } from "./array-utils.ts";

const SAMPLE_RATE = 44100;
const TRACK_TRAIL = SAMPLE_RATE;
const ANNOTATIONS_DIRECTORY = "./dataset";
const SAMPLES_DIRECTORY = "./samples_sticks";
const MIDI_DIRECTORY = "./midi";
const MIDI_STRETCH = 2;

async function generateAnnotations(subfolder: string, midiFiles: string[], sampleManager: SampleManager) {
  let noiseIndex = 0;
  const noise = await Promise.all([loadWav("./noise/noise.wav"), loadWav("./noise/noise2.wav")]);

  const annotationsSubfolder = join(ANNOTATIONS_DIRECTORY, subfolder);

  if (existsSync(annotationsSubfolder)) {
    await rm(annotationsSubfolder, { recursive: true });
  }

  await mkdir(annotationsSubfolder, { recursive: true });

  for (let midiIndex = 0; midiIndex < midiFiles.length; midiIndex++) {
    let midi = await parseMidi(join(MIDI_DIRECTORY, midiFiles[midiIndex]), MIDI_STRETCH);

    if (!midi) {
      console.error(`Midi file ${midiFiles[midiIndex]} not found`);
      continue;
    }

    midi = balanceMidi(midi, sampleManager.numberOfClasses);

    if (midi.noteGroups.length < sampleManager.numberOfClasses) {
      console.log(`Skipping midi ${midiFiles[midiIndex]}. Not enough notes`);
      continue;
    }

    const annotations = [];

    const annotationsByClass: Record<string, number[]> = {};

    const trackLength = Math.floor(midi.duration * SAMPLE_RATE + TRACK_TRAIL);

    const track = new Track(SAMPLE_RATE, trackLength);

    const annotationDirectory = join(annotationsSubfolder, `annotation_${midiIndex}`);

    await mkdir(annotationDirectory, { recursive: true });

    for (let referenceIndex = 0; referenceIndex < midi.noteGroups.length; referenceIndex++) {
      const { sample, audioClass } = sampleManager.getNextSample();

      const referenceFilename = `reference-${referenceIndex}.wav`;

      await saveAudioBuffer(sample, join(annotationDirectory, referenceFilename));

      const positions = [];

      for (const note of midi.noteGroups[referenceIndex]) {
        const sampleStart = Math.floor(note.time * SAMPLE_RATE);

        track.merge(sample, sampleStart, 1);

        positions.push({ from: note.time });
      }

      track.merge(noise[noiseIndex % noise.length], 0, 1);
      noiseIndex++;

      if (!annotationsByClass[audioClass]) {
        annotationsByClass[audioClass] = [];
      }

      annotationsByClass[audioClass].push(...positions.map(({ from }) => from));

      annotations.push({ reference: referenceFilename, audioClass, positions });
    }

    for (const [audioClass, positions] of Object.entries(annotationsByClass)) {
      annotationsByClass[audioClass] = positions.sort((a, b) => a - b);
      annotationsByClass[audioClass] = [...new Set(annotationsByClass[audioClass])];
    }

    writeFile(join(annotationDirectory, "annotations.json"), JSON.stringify(annotations));
    writeFile(join(annotationDirectory, "annotationsByClass.json"), JSON.stringify(annotationsByClass));

    await track.saveFile(join(annotationDirectory, "audio.wav"));
  }
}

async function main() {
  const midiFiles = await readdir(MIDI_DIRECTORY);

  const [trainingMidi, testingMidi] = randomSplitArray(midiFiles, 0.8);
  const { trainingSamples, testingSamples } = await loadSamples(SAMPLE_RATE, SAMPLES_DIRECTORY, 1.0);

  console.log(`Found ${trainingMidi.length} training midi files and ${testingMidi.length} testing midi files.`);
  console.log(`Found ${trainingSamples.length} training samples and ${testingSamples.length} testing samples.`);

  await generateAnnotations("training", trainingMidi, trainingSamples);
  await generateAnnotations("testing", testingMidi, trainingSamples);
}

main();
