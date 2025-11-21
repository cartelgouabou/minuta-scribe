import { useState, useRef } from "react";

export default function TranscriptionLive() {
  const [messages, setMessages] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const processorRef = useRef<AudioWorkletNode | null>(null);

  // --- RESAMPLER 44.1/48 kHz → 16 kHz ---
  function resampleTo16k(input: Float32Array, inputRate: number): Float32Array {
    const targetRate = 16000;
    const ratio = inputRate / targetRate;
    const outputLength = Math.floor(input.length / ratio);
    const output = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const index = i * ratio;
      const left = Math.floor(index);
      const right = Math.min(left + 1, input.length - 1);
      const frac = index - left;

      // interpolation linéaire stable
      output[i] = input[left] + frac * (input[right] - input[left]);
    }

    return output;
  }

  async function startRecording() {
    if (isRecording) return;

    const ws = new WebSocket("ws://localhost:8000/transcribe");
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const text = event.data as string;

      // --- Détection Résumé automatique ---
      if (text.startsWith("=== RÉSUMÉ DE RÉUNION ===")) {
        setMessages((prev) => [
          ...prev,
          "",
          "📝 Résumé automatique :",
          text.replace("=== RÉSUMÉ DE RÉUNION ===", "").trim(),
        ]);
        return;
      }

      // --- Messages normaux (transcription) ---
      setMessages((prev) => [...prev, text]);
    };

    // accéder au micro
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    // 🔥 IMPORTANT : browser sample rate = 44100 (Chrome) / 48000 (Safari)
    const audioContext = new AudioContext();
    const inputSampleRate = audioContext.sampleRate;

    console.log("🎤 Browser sample rate:", inputSampleRate);

    const source = audioContext.createMediaStreamSource(stream);

    await audioContext.audioWorklet.addModule(
      new URL("../worklets/pcm-processor.js", import.meta.url)
    );

    const processor = new AudioWorkletNode(audioContext, "pcm-processor");
    processorRef.current = processor;

    processor.port.onmessage = (event) => {
      const chunk = event.data as Float32Array;

      // --- RESAMPLING vers 16 kHz ---
      const resampled = resampleTo16k(chunk, inputSampleRate);

      const int16Data = new Int16Array(resampled.length);
      for (let i = 0; i < resampled.length; i++) {
        int16Data[i] = Math.max(-1, Math.min(1, resampled[i])) * 0x7fff;
      }

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(int16Data.buffer);
      }
    };

    source.connect(processor);
    processor.connect(audioContext.destination);

    setIsRecording(true);
  }


  function stopRecording() {
    setIsRecording(false);
    processorRef.current?.disconnect();
    wsRef.current?.close();
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>🎧 Transcription Live</h1>

      <button onClick={startRecording} disabled={isRecording}>
        Start Recording
      </button>

      <button onClick={stopRecording} disabled={!isRecording}>
        Stop Recording
      </button>

      <div
        style={{
          marginTop: "1rem",
          padding: "1rem",
          background: "#fafafa",
          minHeight: "150px",
        }}
      >
        {messages.map((msg, idx) => (
          <div key={idx}>{msg}</div>
        ))}
      </div>
    </div>
  );
}
