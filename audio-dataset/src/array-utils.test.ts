import { expect, test, describe, it, afterEach, vi } from "vitest";
import { random, randomSplitArray, removeEvenly, shuffleArray } from "./array-utils.ts";

const originalRandom = Math.random;

describe("array-utils -> random", () => {
  it("should return scaled number", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const result = random(0, 2);

    expect(result).toEqual(1);

    const result2 = random(0, 10);

    expect(result2).toEqual(5);
  });

  it("should work with negative numbers", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const result = random(-3, -1);

    expect(result).toEqual(-2);
  });
});

describe("array-utils -> randomSplitArray", () => {
  it("should split array", () => {
    const array = [1, 2, 3, 4, 5, 6];
    const result = randomSplitArray(array, 0.33);

    expect(result[0].length).toEqual(2);
    expect(result[1].length).toEqual(4);
  });

  it("should return original array in result[1] if split is 0", () => {
    const array = [1, 2, 3, 4, 5, 6];
    const result = randomSplitArray(array, 0);

    expect(result[1].length).toEqual(6);
  });

  it("should return original array in result[0] if split is 1", () => {
    const array = [1, 2, 3, 4, 5, 6];
    const result = randomSplitArray(array, 1);

    expect(result[0].length).toEqual(6);
  });
});

describe("array-utils -> shuffleArray", () => {
  it("should shuffle array", () => {
    const array = [1, 2, 3, 4, 5, 6];
    const result = shuffleArray([...array]);

    expect(result.length).toEqual(6);
    expect(result).not.toEqual(array);
    expect(new Set(array)).toEqual(new Set(result));
  });
});

describe("array-utils -> removeEvenly", () => {
  it("should remove elements evenly", () => {
    const array = [1, 2, 3, 4, 5];
    const result = removeEvenly(array, 2);

    expect(result.length).toEqual(3);
    expect(result).toEqual([1, 3, 5]);
  });

  it("should return empty array if all elements are removed", () => {
    const array = [1, 2, 3, 4, 5];
    const result = removeEvenly(array, 5);

    expect(result.length).toEqual(0);
    expect(result).toEqual([]);
  });

  it("should return copy of original array if nothing is removed", () => {
    const array = [1, 2, 3, 4, 5];
    const result = removeEvenly(array, 0);

    expect(result).toEqual(array);
  });
});

afterEach(() => {
  vi.clearAllMocks();
});
