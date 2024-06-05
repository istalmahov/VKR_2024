import { readdir } from "fs/promises";
import { join } from "path";

import { SampleManager } from "./sample-manager.ts";
import { lstatSync } from "fs";
import { randomSplitArray } from "./array-utils.ts";

const DISABLED_CLASSES: string[] = [];

export async function loadSamples(sampleRate: number, path: string, trainingSplitSize: number) {
  const rootDirectory = await readdir(path);
  const sampleClasses = rootDirectory.filter((sampleClass) => !DISABLED_CLASSES.includes(sampleClass));

  const trainingSamples = new SampleManager(sampleClasses, sampleRate);
  const testingSamples = new SampleManager(sampleClasses, sampleRate);

  for (let sampleClass of sampleClasses) {
    const classPath = join(path, sampleClass);

    if (!lstatSync(classPath).isDirectory()) {
      continue;
    }

    let audioFiles = await readdir(classPath);

    audioFiles = audioFiles.filter((filename) => filename.endsWith(".wav"));

    const [trainingSplit, testSplit] = randomSplitArray(audioFiles, trainingSplitSize);

    await trainingSamples.loadSampleClass(classPath, sampleClass, trainingSplit);
    await testingSamples.loadSampleClass(classPath, sampleClass, testSplit);
  }

  return { trainingSamples, testingSamples };
}
