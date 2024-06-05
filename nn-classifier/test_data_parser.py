import unittest
import numpy as np
from unittest.mock import patch

from data_parser import Dataparser


class TestParser(unittest.TestCase):
    def test_split_windows(self):
        sample_rate = 44100
        window_size = 8192
        parser = Dataparser('', sample_rate, window_size, False, ['bass', 'snare'])

        number_of_windows = 10

        full_audio = np.zeros(window_size * number_of_windows)

        windows = parser.split_windows(full_audio)

        self.assertEqual(len(windows), number_of_windows)

        for window in windows:
            self.assertEqual(len(window), window_size)

    def test_labels(self):
        sample_rate = 44100
        window_size = 8192
        parser = Dataparser('', sample_rate, window_size, False, ['bass', 'snare'])

        with patch.object(np, 'save', new=lambda x, y: None):
            onsets_seconds = [0, 0.7, 1]
            onsets_samples = map(lambda x: x * sample_rate, onsets_seconds)

            labels = parser.get_labels('', '', 10, onsets_seconds)

            self.assertEqual(len(labels), 10)

            for onset in onsets_samples:
                window_index = int(onset / window_size)
                self.assertEqual(labels[window_index], 1)

    def test_balance_classes(self):
        sample_rate = 44100
        window_size = 8192
        classes = ['bass', 'snare']
        class_count = len(classes) + 1
        parser = Dataparser('', sample_rate, window_size, False, classes)

        zero_count = 150
        bass_count = 12
        snare_count = 11

        parser.parsed_pairs = {
            'feature': [
                *[[1, 0]] * zero_count,
                *[[2, 1]] * bass_count,
                *[[3, 2]] * snare_count
            ]
        }

        parser.balance_classes()

        min_count = min(zero_count, bass_count, snare_count)

        balanced_pairs = parser.parsed_pairs['feature']

        self.assertEqual(len(balanced_pairs), min_count * class_count)


if __name__ == '__main__':
    unittest.main()
