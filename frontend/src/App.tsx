import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import TranscriptionLive from "./pages/TranscriptionLive";

export default function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: "1rem", background: "#eee" }}>
        <Link to="/transcription">Transcription Live</Link>
      </nav>

      <Routes>
        <Route path="/transcription" element={<TranscriptionLive />} />
        <Route path="*" element={<div>Home</div>} />
      </Routes>
    </BrowserRouter>
  );
}
