export function removeEvenly<T>(array: T[], removeCount: number) {
  if (removeCount === 0) {
    return array;
  }

  if (removeCount >= array.length) {
    return [];
  }

  const step = array.length / removeCount;

  const result = [];

  for (let i = 0, j = 0; i < array.length; i += 1) {
    const indexToRemove = Math.floor(0.5 * step + j * step);

    if (i === indexToRemove) {
      j++;
      continue;
    }

    result.push(array[i]);
  }

  return result;
}

export function randomSplitArray<T>(array: T[], splitPercent: number): [T[], T[]] {
  const arrayCopy = [...array];

  const shuffled = shuffleArray(arrayCopy);

  const splitIndex = Math.ceil(shuffled.length * splitPercent);

  const left = shuffled.splice(0, splitIndex);

  return [left, shuffled];
}

export function shuffleArray<T>(array: T[]) {
  let index = -1,
    length = array.length,
    lastIndex = length - 1;

  const size = length;

  while (++index < size) {
    var rand = random(index, lastIndex),
      value = array[rand];

    array[rand] = array[index];
    array[index] = value;
  }

  array.length = size;

  return array;
}

export function random(lower: number, upper: number) {
  return lower + Math.floor(Math.random() * (upper - lower + 1));
}
