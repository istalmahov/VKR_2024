import { join } from "path";

import { loadWav } from "./wav-encode-decode.ts";

export class SampleManager {
  public samples: Record<string, AudioBuffer[]> = {};
  public length = 0;

  private samplesCursors: Record<string, number> = {};
  private classCursor = 0;

  public numberOfClasses = 0;

  constructor(private readonly sampleClasses: string[], private readonly sampleRate: number) {
    this.numberOfClasses = sampleClasses.length;
    this.initCursors();
  }

  public getNextSample() {
    const currentClass = this.sampleClasses[this.classCursor++];
    const currentCursor = this.samplesCursors[currentClass]++;

    const sample = this.samples[currentClass][currentCursor];

    if (this.classCursor >= this.sampleClasses.length) {
      this.classCursor = 0;
    }

    if (this.samplesCursors[currentClass] >= this.samples[currentClass].length) {
      this.samplesCursors[currentClass] = 0;
    }

    return { sample, audioClass: currentClass };
  }

  public async loadSampleClass(path: string, sampleClass: string, files: string[]) {
    this.samples[sampleClass] = [];

    for (const audioFile of files) {
      if (!audioFile.endsWith(".wav")) {
        continue;
      }

      const audio = await loadWav(join(path, audioFile));

      if (audio.sampleRate !== this.sampleRate) {
        console.error(`Sample ${audioFile} has wring sample rate (${audio.sampleRate}). Expected ${this.sampleRate}`);
        continue;
      }

      this.samples[sampleClass].push(audio);
      this.length++;
    }
  }

  private initCursors() {
    for (const sampleClass of this.sampleClasses) {
      this.samplesCursors[sampleClass] = 0;
    }
  }
}
