import torch
import librosa
import torchaudio
import numpy as np
import matplotlib.pyplot as plt

from data_params import data_params
from modelCNN import ClassifierCNN
from modelResCNN import ClassifierResCNN
from modelCNNMFCC import ClassifierCNNMFCC
from dev import device

model_name = './models/model_2024-05-24 11:29:42.510443'

# transform = torchaudio.transforms.MFCC(sample_rate=44100, n_mfcc=12, melkwargs={'normalized': True})
transform = torchaudio.transforms.MelSpectrogram(sample_rate=44100, n_mels=70, normalized=True)


def get_features(window):
    onsets = librosa.onset.onset_detect(
        y=window,
        sr=data_params['sample_rate'],
        backtrack=True,
        units="samples",
        pre_max=128,
        post_max=128,
    )

    if (len(onsets) > 0):
        window = np.pad(window[onsets[0]:], (0, onsets[0]))

    normalized = librosa.util.normalize(window)

    audio_features: torch.Tensor = transform(torch.from_numpy(normalized))

    return np.array(audio_features)


# Load pytorch model
model = ClassifierCNN(4)
# model = ClassifierResCNN(4)
# model = ClassifierCNNMFCC(4)
model.load_state_dict(torch.load(model_name))
model.eval()

audio_file = './data/testing/annotation_0/audio.wav'

audio = librosa.load(audio_file, sr=data_params['sample_rate'])[0]

windows = [audio[i:i + data_params['window_size']]
           for i in range(0, len(audio) - data_params['window_size'], data_params['window_size'])]


windows = [get_features(window) for window in windows]

windows = np.array(windows)

windows = torch.tensor(windows)

predictions_logits = model(windows)

predictions = torch.sigmoid(predictions_logits).cpu().detach().numpy()

bass = []
snare = []
hihat = []

plt.plot(audio)

for i, prediction in enumerate(predictions):
    window_start = i * data_params['window_size']
    window_end = window_start + data_params['window_size']

    plt.axvspan(window_start, window_end, alpha=prediction[1], color='r', ymin=0.0, ymax=0.33)
    plt.axvspan(window_start, window_end, alpha=prediction[2], color='g', ymin=0.33, ymax=0.66)
    plt.axvspan(window_start, window_end, alpha=prediction[3], color='b', ymin=0.66, ymax=1.0)

    prediction = np.argmax(prediction)

    position_seconds = i * data_params['window_size'] / data_params['sample_rate']

    if prediction == 1:
        bass.append(position_seconds)
    elif prediction == 2:
        snare.append(position_seconds)
    elif prediction == 3:
        hihat.append(position_seconds)

plt.show()

print('bass', bass)
print('snare', snare)
print('hihat', hihat)
