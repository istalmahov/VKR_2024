import torch
import librosa
import torchaudio
import numpy as np
import matplotlib.pyplot as plt
import json
import asyncio

from websockets.server import serve
from data_params import data_params
from modelCNN import ClassifierCNN
from modelCNNMFCC import ClassifierCNNMFCC
from modelResCNN import ClassifierResCNN
from dev import device

model_name = './models/ResNet'

# transform = torchaudio.transforms.MFCC(sample_rate=44100, n_mfcc=12, melkwargs={'normalized': True})
transform = torchaudio.transforms.MelSpectrogram(sample_rate=44100, n_mels=70, normalized=True)

model = ClassifierResCNN(4)
model.load_state_dict(torch.load(model_name))
model.eval()


def process_window(window: np.array) -> torch.Tensor:
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

    window = librosa.util.normalize(window)
    window = transform(torch.from_numpy(window))
    window = window.unsqueeze(0)

    predictions_logits = model(window)

    predictions = torch.sigmoid(predictions_logits)

    return predictions


async def echo(websocket):
    async for message in websocket:
        channel_data = np.frombuffer(message, dtype=np.float32)
        predictions = process_window(channel_data)
        predictions = predictions[0].tolist()
        await websocket.send(json.dumps(predictions))
        print(np.round(predictions, 4))


async def main():
    async with serve(echo, "127.0.0.1", 4269):
        await asyncio.Future()

asyncio.run(main())
