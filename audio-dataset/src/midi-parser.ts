import midi from "@tonejs/midi";
import { Note } from "@tonejs/midi/dist/Note";
import { readFile } from "fs/promises";
import { removeEvenly } from "./array-utils.ts";

export type Midi = {
  duration: number;
  noteGroups: Note[][];
};

export async function loadMidi(path: string) {
  const midiFile = await readFile(path);

  return new midi.Midi(midiFile);
}

export async function parseMidi(path: string, stretch: number): Promise<Midi | null> {
  const midi = await loadMidi(path);

  const track = midi.tracks[0];

  if (!track) {
    console.log(`Midi ${path} invalid. Track not found`);
    return null;
  }

  const noteMap = track.notes.reduce((noteMap, note) => {
    note.time = note.time * stretch;

    if (noteMap[note.midi]) {
      noteMap[note.midi].push(note);
    } else {
      noteMap[note.midi] = [note];
    }

    return noteMap;
  }, {} as Record<number, Note[]>);

  return { duration: midi.duration, noteGroups: Object.values(noteMap) };
}

export function balanceMidi(midi: Midi, numberOfClasses: number) {
  let noteGroups = midi.noteGroups;

  if (noteGroups.length > numberOfClasses) {
    const sorted = noteGroups.sort((a, b) => b.length - a.length);
    noteGroups = sorted.slice(0, numberOfClasses);
  }

  const minNotesCount = Math.min(...noteGroups.map((group) => group.length));

  for (let i = 0; i < noteGroups.length; i++) {
    const group = noteGroups[i];

    if (group.length > minNotesCount) {
      noteGroups[i] = removeEvenly(group, group.length - minNotesCount);
    }
  }

  return { duration: midi.duration, noteGroups };
}
