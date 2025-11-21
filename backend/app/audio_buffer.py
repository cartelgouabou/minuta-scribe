import threading

class AudioBuffer:
    def __init__(self):
        self.lock = threading.Lock()
        self.pcm = bytearray()

    def append(self, pcm_bytes: bytes):
        with self.lock:
            self.pcm.extend(pcm_bytes)

    def get_pcm(self):
        with self.lock:
            return bytes(self.pcm)
