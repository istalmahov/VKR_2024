from sklearn.metrics import accuracy_score, confusion_matrix
import torch
import torch.utils.data
import torch.nn as nn
import librosa
import matplotlib.pyplot as plt
import random
import numpy as np
from datetime import datetime
from torch.utils.tensorboard import SummaryWriter
from audio_dataset import DrumAnalyzerDataset
from modelCNN import ClassifierCNN
from modelCNNMFCC import ClassifierCNNMFCC
from modelResCNN import ClassifierResCNN
from modelResCNNMFCC import ClassifierResCNNMFCC
from data_params import data_params
from dev import device

torch.manual_seed(42)
np.random.seed(42)
random.seed(42)

writer = SummaryWriter()

sample_rate = data_params['sample_rate']
window_size = data_params['window_size']
window_overlap = data_params['window_overlap']
melspectrogram_length = data_params['melspectrogram_length']

BATCH_SIZE = 32
FEATURE = 'melspec'

training_dataset = DrumAnalyzerDataset("./data/training", FEATURE)
testing_dataset = DrumAnalyzerDataset("./data/testing", FEATURE)

training_data = torch.utils.data.DataLoader(training_dataset, shuffle=True, batch_size=BATCH_SIZE, drop_last=True)
testing_data = torch.utils.data.DataLoader(testing_dataset, shuffle=True, batch_size=BATCH_SIZE, drop_last=True)


def train():
    print('Using ', device)

    model = ClassifierCNN(number_of_classes=4).to(device)

    loss_fn = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(params=model.parameters(), lr=0.001)

    epochs = 512
    total_runs = 0

    for epoch in range(epochs):
        print(f"Epoch {epoch}")

        for (windows, labels) in training_data:
            optimizer.zero_grad()
            model.train()

            labels = labels.to(device)

            train_logits = model(windows.to(device))

            train_loss = loss_fn(train_logits.squeeze(), labels)

            train_loss.backward()
            optimizer.step()

            writer.add_scalar('Loss/train', train_loss, total_runs)

            total_runs += 1

            if total_runs % 25 == 0:
                model.eval()
                with torch.inference_mode():
                    (test_windows, test_labels) = next(
                        iter(testing_data))

                    test_logits = model(test_windows.to(device))

                    test_predictions = torch.sigmoid(test_logits)
                    train_predictions = torch.sigmoid(train_logits)

                    test_loss = loss_fn(test_logits.squeeze(), test_labels.to(device))

                    train_accuracy = accuracy_score(labels.cpu(), np.argmax(
                        train_predictions.cpu(), axis=1), normalize=True)
                    test_accuracy = accuracy_score(test_labels.cpu(), np.argmax(
                        test_predictions.cpu(), axis=1), normalize=True)

                    writer.add_scalar('Loss/test', test_loss, total_runs)

                    writer.add_scalar('Accuracy/test', test_accuracy, total_runs)
                    writer.add_scalar('Accuracy/train', train_accuracy, total_runs)

    torch.save(model.state_dict(), f'./models/model_{datetime.now()}')


train()
