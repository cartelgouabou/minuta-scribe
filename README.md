# minuta-scribe
## 🔊 Installation Whisper.cpp (Offline Speech-to-Text)

Cette section décrit l'installation de **Whisper.cpp**, un moteur de transcription 100% local compilé en C/C++.

---

### 1. 🧰 Prérequis macOS

Avant d’installer Whisper.cpp, installe les outils nécessaires :

```bash
brew install make
brew install cmake
brew install ffmpeg
```

---

### 2. 📥 Cloner le dépôt Whisper.cpp

```bash
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp
```

---

### 3. 🔧 Compilation de Whisper.cpp

```bash
make
```

Après compilation, les exécutables sont disponibles dans `./build/bin`.

---

### 4. 📦 Télécharger un modèle Whisper

Exemple pour le modèle **small** (bon compromis vitesse/qualité) :

```bash
bash ./models/download-ggml-model.sh small
```

Le modèle sera téléchargé dans :

```
whisper.cpp/models/ggml-small.bin
```

---

### 5. 🎤 Enregistrer un fichier audio WAV (macOS)

Lister les devices audio :

```bash
ffmpeg -f avfoundation -list_devices true -i ""
```

Exemples de devices :

```
[0] Microphone externe
[1] Microphone MacBook Pro
```

Enregistrer 3 secondes depuis le micro :

```bash
ffmpeg -f avfoundation -i ":0" -t 3 test.wav
```

---

### 6. 🧪 Tester Whisper.cpp en ligne de commande

```bash
./build/bin/whisper-cli \
  -m models/ggml-small.bin \
  -f test.wav
```

---

### 7. 🐍 Test Python (script fourni)

Créer le fichier :

```
project/backend/app/test_whisper.py
```

Contenu :

```python
import subprocess
import sys
import os

WHISPER_PATH = os.path.expanduser("~/RD/minuta-scribe/whisper.cpp")
MODEL_PATH = f"{WHISPER_PATH}/models/ggml-small.bin"
WAV_FILE = "test.wav"

def transcribe():
    cmd = [
        f"{WHISPER_PATH}/build/bin/whisper-cli",
        "-m", MODEL_PATH,
        "-f", WAV_FILE
    ]

    print("Running command:", " ".join(cmd))
    result = subprocess.run(cmd, capture_output=True, text=True)

    print("=== TRANSCRIPTION ===")
    print(result.stdout)

if __name__ == "__main__":
    if not os.path.exists(WAV_FILE):
        print(f"Error: {WAV_FILE} not found")
        sys.exit(1)

    transcribe()
```

Lancer le test :

```bash
cd project/backend/app
python test_whisper.py
```
