import torch
import torch.utils.data
import torch.nn as nn


class ClassifierCNNMFCC(nn.Module):
    def __init__(self, number_of_classes: int):
        super(ClassifierCNNMFCC, self).__init__()

        self.conv1 = nn.Sequential(
            nn.Conv2d(1, 6, kernel_size=2, stride=2),
            nn.BatchNorm2d(6),
            nn.ReLU())

        self.conv2 = nn.Sequential(nn.Dropout(0.2),
                                   nn.Conv2d(6, 16, kernel_size=2, stride=2),
                                   nn.BatchNorm2d(16),
                                   nn.ReLU())

        self.conv3 = nn.Sequential(nn.Dropout(0.1),
                                   nn.Conv2d(16, 32, kernel_size=2, stride=2),
                                   nn.BatchNorm2d(32),
                                   nn.ReLU())

        self.dropout1 = nn.Dropout(0.5)
        self.dropout2 = nn.Dropout(0.2)
        self.fc1 = nn.Linear(160, 128)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(128, 64)
        self.fc3 = nn.Linear(64, number_of_classes)

    def forward(self, windows: torch.Tensor):
        batch_size, bins, window_length = windows.shape

        x = windows.view(batch_size, 1, bins, window_length)

        x = self.conv1(x)
        x = self.conv2(x)
        x = self.conv3(x)

        x = x.view(windows.size(0), -1)

        x = self.fc1(x)
        x = self.relu(x)
        x = self.dropout1(x)
        x = self.fc2(x)
        x = self.relu(x)
        x = self.dropout2(x)
        x = self.fc3(x)

        return x
