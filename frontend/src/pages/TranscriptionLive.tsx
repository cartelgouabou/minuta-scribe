import { useEffect, useState } from "react";

export default function TranscriptionLive() {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/transcribe");

    ws.onmessage = (event: MessageEvent) => {
      setMessages((prev) => [...prev, event.data]);
    };

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
    };

    return () => ws.close();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>🎧 Transcription Live</h1>

      <div
        style={{
          marginTop: "1rem",
          padding: "1rem",
          border: "1px solid #ccc",
          borderRadius: "8px",
          minHeight: "150px",
          background: "#fafafa",
        }}
      >
        {messages.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: "0.5rem" }}>
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
}

