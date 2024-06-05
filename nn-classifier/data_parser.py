import json
import os
import librosa
import numpy as np
import torch
import torchaudio

from torch import nn


class Dataparser():
    def __init__(self, annotations_dir: str, sample_rate: int, window_size: int, regenerate: bool, classes: list[str]):
        self.dir = annotations_dir
        self.sample_rate = sample_rate
        self.window_size = window_size
        self.regenerate = regenerate

        self.classes = classes

        self.parsed_pairs = {
            'melspec': [],
            'mfcc': []
        }

        self.mfcc = torchaudio.transforms.MFCC(sample_rate=self.sample_rate, n_mfcc=12, melkwargs={'normalized': True})
        self.melspec = torchaudio.transforms.MelSpectrogram(sample_rate=self.sample_rate, n_mels=70, normalized=True)

    def process_data(self):
        files = os.listdir(self.dir)

        for (i, filename) in enumerate(files):
            if not os.path.isdir(os.path.join(self.dir, filename)):
                continue

            self.parse(filename)

            print(f'Processed {filename}. {i}/{len(files)}')

        self.balance_classes()

        self.save_data()

    def save_data(self):
        for feature in self.parsed_pairs:
            np.save(f"{self.dir}/parsed_{feature}.npy", np.array(self.parsed_pairs[feature]))

    def remove_extra_zero_labels(self):
        for feature in self.parsed_pairs:
            data = np.array(self.parsed_pairs[feature])

            positive_data = data[data[:, 1] > 0]
            negative_data = data[data[:, 1] == 0]

            if len(positive_data) > len(negative_data):
                positive_data = positive_data[:len(negative_data)]
            else:
                negative_data = negative_data[:len(positive_data)]

            self.parsed_pairs[feature] = np.concatenate([positive_data, negative_data])

    def balance_classes(self):
        for feature in self.parsed_pairs:
            data = np.array(self.parsed_pairs[feature])

            zero_labels = data[data[:, 1] == 0]
            zero_label_count = len(zero_labels)
            classes_counts = [zero_label_count]

            for class_index, _ in enumerate(self.classes):
                class_data = data[data[:, 1] == class_index + 1]
                class_count = len(class_data)
                classes_counts.append(class_count)

            classes_counts = np.array(classes_counts)

            print(f'Classes counts: {classes_counts}')

            min_count = np.min(classes_counts)

            balanced_data = []

            for index, _ in enumerate(classes_counts):
                class_data = data[data[:, 1] == index]
                class_data = class_data[:min_count]
                balanced_data.append(class_data)

            balanced_data = np.concatenate(balanced_data)

            self.parsed_pairs[feature] = balanced_data

    def parse(self, folder: str):
        annotation_path = os.path.join(self.dir, folder)

        if folder == 'classes':
            return

        [audio, _] = librosa.load(f"{annotation_path}/audio.wav", sr=self.sample_rate)

        windows = self.split_windows(audio)

        windows_features_melspec = self.get_windows_features(annotation_path, windows, self.melspec, 'melspec')
        windows_features_mfcc = self.get_windows_features(annotation_path, windows, self.mfcc, 'mfcc')

        annotations = json.load(open(f"{annotation_path}/annotationsByClass.json"))

        all_labels = []

        for audioClass in self.classes:
            print('\tParsing ' + audioClass)

            labels = self.get_labels(annotation_path, audioClass, len(
                windows_features_melspec), annotations[audioClass])

            all_labels.append(labels)

        all_labels = np.array(all_labels)
        all_labels = all_labels.T

        window_label_pairs_melspec = []
        window_label_pairs_mfcc = []

        for index in range(len(all_labels)):
            positive_sum = np.sum(all_labels[index])

            if positive_sum > 1:
                pass

            # Find index of first positive label
            label = np.argmax(all_labels[index]) + 1 if positive_sum == 1 else 0

            window_label_pairs_melspec.append([windows_features_melspec[index], label])
            window_label_pairs_mfcc.append([windows_features_mfcc[index], label])

        self.parsed_pairs['melspec'] = self.parsed_pairs['melspec'] + window_label_pairs_melspec
        self.parsed_pairs['mfcc'] = self.parsed_pairs['mfcc'] + window_label_pairs_mfcc

    def get_labels(self, annotation_path: str, reference_filename: str, windows_count: int, positions):
        if self.regenerate == False:
            try:
                labels = np.load(
                    f"{annotation_path}/{reference_filename}.labels.npy")
                return labels
            except:
                pass

        positions = sorted(positions)

        labels = np.ndarray(windows_count, np.float32)
        labels.fill(0)

        for index in range(windows_count):
            if (labels[index] == 1):
                continue

            offset = index * self.window_size
            window_left_bound = offset if index > 0 else 0
            window_right_bound = offset + self.window_size

            if len(positions) == 0:
                break

            closest_position = positions[0] * self.sample_rate

            if window_left_bound <= closest_position <= window_right_bound:
                positions.pop(0)

                labels[index] = np.float32(1)
            else:
                labels[index] = np.float32(0)

        np.save(f"{annotation_path}/{reference_filename}.labels.npy",
                labels)

        return labels

    def split_windows(self, audio: np.ndarray):
        audio_windows = librosa.util.frame(audio, frame_length=self.window_size, hop_length=self.window_size, axis=0)

        shifted_windows = []

        for window in audio_windows:
            onsets = librosa.onset.onset_detect(
                y=window,
                sr=self.sample_rate,
                backtrack=True,
                units="samples",
                pre_max=128,
                post_max=128,
            )

            if (len(onsets) > 0):
                window = np.pad(window[onsets[0]:], (0, onsets[0]))

            shifted_windows.append(window)

        return shifted_windows

    def get_normalized_features(self, audio: np.ndarray, transform: nn.Module) -> torch.Tensor:
        normalized = librosa.util.normalize(audio)

        audio_features = transform(torch.from_numpy(normalized))

        return audio_features

    def get_windows_features(self, annotation_path: str, audio_windows: list[np.ndarray], transform: nn.Module, name: str):
        if self.regenerate == False:
            try:
                features = np.load(f"{annotation_path}/audio_windows.{name}.npy")
                return features
            except:
                pass

        # get features for audio windows
        features = [self.get_normalized_features(audio_window, transform) for audio_window in audio_windows]

        np.save(f"{annotation_path}/audio_windows.{name}.npy", features)

        return features


if __name__ == "__main__":
    from data_params import data_params

    print(data_params)

    training_parser = Dataparser(
        annotations_dir='./data/training',
        sample_rate=data_params.get('sample_rate'),
        window_size=data_params.get('window_size'),
        regenerate=True,
        classes=['bass', 'snare', 'hihat']
    )

    training_parser.process_data()
    print("Done parsing training dataset")

    testing_parser = Dataparser(
        annotations_dir='./data/testing',
        sample_rate=data_params.get('sample_rate'),
        window_size=data_params.get('window_size'),
        regenerate=True,
        classes=['bass', 'snare', 'hihat']
    )

    testing_parser.process_data()
    print("Done parsing testing dataset")

    exit(0)
