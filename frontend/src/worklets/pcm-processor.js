class PCMProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];

    if (input && input.length > 0) {
      // Envoi du Float32Array brut (44.1 kHz ou 48 kHz)
      this.port.postMessage(input[0]);
    }

    return true;
  }
}

registerProcessor("pcm-processor", PCMProcessor);
