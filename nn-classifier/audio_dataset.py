import numpy as np
from torch.utils.data import Dataset


class DrumAnalyzerDataset(Dataset):
    def __init__(self, folder: str, feature: str, remove_zero_labels=False):
        self.feature = feature
        self.remove_zero_labels = remove_zero_labels

        self.load_data(folder)

    def __len__(self):
        return self.length

    def __getitem__(self, index):
        window, label = self.data[index]

        return window, label

    def load_data(self, folder: str):
        self.data = np.load(f"{folder}/parsed_{self.feature}.npy", allow_pickle=True)

        # Remove zero labels
        if self.remove_zero_labels:
            self.data = [x for x in self.data if x[1] != 0]

        self.length = len(self.data)
