import { WINDOW_LENGTH } from "./constants";

export function createWebSocket(url: string, port: MessagePort) {
  const webSocket = new WebSocket(url);

  webSocket.onopen = (e) => console.log(e);
  webSocket.onclose = (e) => console.log(e);
  webSocket.onerror = (e) => console.log(e);

  port.onmessage = (event) => {
    if (webSocket.readyState !== webSocket.OPEN) {
      return;
    }

    const channels: Float32Array[] = event.data;

    if (channels[0].length !== WINDOW_LENGTH) {
      console.log("Channel length mismatch");
      return;
    }

    const data = new Float32Array(WINDOW_LENGTH);

    for (let i = 0; i < WINDOW_LENGTH; i++) {
      data[i] = channels[0][i] / 2 + channels[1][i] / 2;
    }

    webSocket.send(data);
  };

  return webSocket;
}
