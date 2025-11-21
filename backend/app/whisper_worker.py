import subprocess
import threading
import time
import wave
import tempfile
import os


class WhisperWorker:
    def __init__(self, whisper_path, model_path, audio_buffer, callback):
        self.whisper_path = whisper_path
        self.model_path = model_path
        self.buffer = audio_buffer
        self.callback = callback
        self.running = False

    def start(self):
        self.running = True
        t = threading.Thread(target=self.loop, daemon=True)
        t.start()

    def stop(self):
        self.running = False

    def loop(self):
        last_output = ""

        while self.running:
            try:
                pcm = self.buffer.get_pcm()

                # attendre 200ms d'audio 
                if len(pcm) < 3200:  # 16000 * 0.2 sec * 2 bytes
                    time.sleep(0.1)
                    continue

                with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
                    wav_path = tmp.name

                # écrire WAV 16kHz
                with wave.open(wav_path, "wb") as wf:
                    wf.setnchannels(1)
                    wf.setsampwidth(2)
                    wf.setframerate(16000)
                    wf.writeframes(pcm)

                cmd = [
                    f"{self.whisper_path}/build/bin/whisper-cli",
                    "-m", self.model_path,
                    "-f", wav_path,
                    "--no-timestamps",
                    "--language", "fr"
                ]

                result = subprocess.run(cmd, capture_output=True, text=True)
                text = result.stdout.strip()

                print("🔥 WHISPER RAW OUTPUT:", text)

                if text and text != last_output:
                    last_output = text
                    self.callback(text)

                os.remove(wav_path)

            except Exception as e:
                print("Whisper error:", e)

            # délai de rafraîchissement
            time.sleep(0.4)
