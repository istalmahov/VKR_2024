import torch
import torch.utils.benchmark as benchmark
from itertools import product

from modelCNN import ClassifierCNN
from modelCNNMFCC import ClassifierCNNMFCC
from modelResCNN import ClassifierResCNN
from modelResCNNMFCC import ClassifierResCNNMFCC

cnn_melspec = ClassifierCNN(4)
cnn_mfcc = ClassifierCNNMFCC(4)
res_melspec = ClassifierResCNN(4)
res_mfcc = ClassifierResCNNMFCC(4)

cnn_melspec.load_state_dict(torch.load('./models/model_CNN'))
cnn_mfcc.load_state_dict(torch.load('./models/model_CNNMFCC'))
res_melspec.load_state_dict(torch.load('./models/model_ResCNN'))
res_mfcc.load_state_dict(torch.load('./models/model_ResCNNMFCC'))

models = {
    'cnn_melspec': cnn_melspec,
    'cnn_mfcc': cnn_mfcc,
    'res_melspec': res_melspec,
    'res_mfcc': res_mfcc
}

# Compare takes a list of measurements which we'll save in results.
results = []

devices = ['cpu', 'cuda']
features = ['melspec', 'mfcc']
batch_sizes = [1, 4, 32, 64, 128, 256, 512]


def run(model, x):
    with torch.no_grad():
        return model(x)


for device, feature, batch_size in product(devices, features, batch_sizes):
    # label and sub_label are the rows
    # description is the column
    label = 'Audio classification'
    sub_label = f'{device} {feature} {batch_size}'

    x = torch.rand(batch_size, 12, 41) if feature == 'mfcc' else torch.rand(batch_size, 70, 41)
    x = x.to(device)

    cnn = models[f'cnn_{feature}']
    cnn.to(device)
    cnn.eval()
    resnet = models[f'res_{feature}']
    resnet.to(device)
    resnet.eval()

    results.append(benchmark.Timer(
        stmt=f'run(model, x)',
        globals={'run': run, 'model': cnn, 'x': x},
        label=label,
        sub_label=sub_label,
        description='CNN',
    ).timeit(1000))

    results.append(benchmark.Timer(
        stmt='run(model, x)',
        globals={'run': run, 'model': resnet, 'x': x},
        label=label,
        sub_label=sub_label,
        description='ResNet',
    ).timeit(1000))

compare = benchmark.Compare(results)
compare.colorize()
compare.print()
