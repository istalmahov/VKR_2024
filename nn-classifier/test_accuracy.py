import torch
import numpy as np
import torch.utils.data
from sklearn.metrics import accuracy_score

from audio_dataset import DrumAnalyzerDataset
from modelCNN import ClassifierCNN
from modelCNNMFCC import ClassifierCNNMFCC
from modelResCNN import ClassifierResCNN
from modelResCNNMFCC import ClassifierResCNNMFCC

REMOVE_ZERO_LABEL = False

cnn_melspec = ClassifierCNN(4)
cnn_mfcc = ClassifierCNNMFCC(4)
res_melspec = ClassifierResCNN(4)
res_mfcc = ClassifierResCNNMFCC(4)

cnn_melspec.load_state_dict(torch.load('./models/CNN'))
cnn_mfcc.load_state_dict(torch.load('./models/CNN_MFCC'))
res_melspec.load_state_dict(torch.load('./models/ResNet'))
res_mfcc.load_state_dict(torch.load('./models/ResNet_MFCC'))

mfcc_dataset = DrumAnalyzerDataset("./data/testing", 'mfcc', REMOVE_ZERO_LABEL)
melspec_dataset = DrumAnalyzerDataset("./data/testing", 'melspec', REMOVE_ZERO_LABEL)

mfcc_dataloader = torch.utils.data.DataLoader(mfcc_dataset, batch_size=1)
melspec_dataloader = torch.utils.data.DataLoader(melspec_dataset, batch_size=1)

print('Testing accuracy. REMOVE_ZERO_LABEL = ', REMOVE_ZERO_LABEL)

for model in [cnn_mfcc, res_mfcc]:
    model.eval()
    scores = []

    for window, label in mfcc_dataloader:
        output = model(window)
        output = output.detach().numpy()
        output = output.argmax(axis=1)

        accuracy = accuracy_score(label, output)

        scores.append(accuracy)

    print(f'{model.__class__.__name__} {np.mean(scores)}')

for model in [cnn_melspec, res_melspec]:
    model.eval()
    scores = []

    for window, label in melspec_dataloader:
        output = model(window)
        output = output.detach().numpy()
        output = output.argmax(axis=1)

        accuracy = accuracy_score(label, output)

        scores.append(accuracy)

    print(f'{model.__class__.__name__} {np.mean(scores)}')
