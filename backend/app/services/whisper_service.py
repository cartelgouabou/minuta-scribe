import whisper
import tempfile
import os
import subprocess
import torch


class WhisperService:
    def __init__(self, model_size: str = "small"):
        """
        Initialise le service Whisper
        
        Args:
            model_size: Taille du modèle Whisper (tiny, base, small, medium, large)
                       "small" offre un bon compromis qualité/vitesse
        """
        self.model = None
        self.model_size = model_size
        self.device = self._detect_device()

    def _detect_device(self):
        """Détecte automatiquement le meilleur device (GPU si disponible, sinon CPU)"""
        if torch.cuda.is_available():
            device = "cuda"
            print(f"GPU détecté: {torch.cuda.get_device_name(0)}")
        elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            device = "mps"  # Apple Silicon GPU
            print("Apple Silicon GPU (MPS) détecté")
        else:
            device = "cpu"
            print("Aucun GPU détecté, utilisation du CPU")
        return device

    def load_model(self):
        """Charge le modèle Whisper (lazy loading avec cache)"""
        if self.model is None:
            print(f"Chargement du modèle Whisper: {self.model_size} sur {self.device}")
            self.model = whisper.load_model(self.model_size, device=self.device)
            print(f"Modèle Whisper chargé avec succès sur {self.device}")
    
    def preload_model(self):
        """Précharge le modèle au démarrage pour éviter le délai lors de la première transcription"""
        if self.model is None:
            print(f"Préchargement du modèle Whisper: {self.model_size} sur {self.device}")
            self.load_model()
            print(f"✅ Modèle Whisper préchargé et prêt à l'emploi")
        else:
            print(f"✅ Modèle Whisper déjà chargé")

    def convert_webm_to_wav(self, webm_data: bytes) -> bytes:
        """
        Convertit un fichier webm/opus en WAV PCM via ffmpeg
        
        Args:
            webm_data: Données audio au format webm/opus
        
        Returns:
            Données audio au format WAV PCM
        """
        # Créer un fichier temporaire pour l'input
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as input_file:
            input_file.write(webm_data)
            input_path = input_file.name

        try:
            # Créer un fichier temporaire pour l'output
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as output_file:
                output_path = output_file.name

            try:
                # Utiliser ffmpeg pour convertir
                subprocess.run(
                    [
                        "ffmpeg",
                        "-i",
                        input_path,
                        "-ar",
                        "16000",  # Sample rate 16kHz (requis par Whisper)
                        "-ac",
                        "1",  # Mono
                        "-f",
                        "wav",
                        "-y",  # Overwrite output file
                        output_path,
                    ],
                    check=True,
                    capture_output=True,
                )

                # Lire le fichier WAV converti
                with open(output_path, "rb") as f:
                    wav_data = f.read()

                return wav_data
            finally:
                # Nettoyer le fichier de sortie
                if os.path.exists(output_path):
                    os.unlink(output_path)
        finally:
            # Nettoyer le fichier d'entrée
            if os.path.exists(input_path):
                os.unlink(input_path)

    def transcribe_audio(self, audio_data: bytes, is_webm: bool = True) -> str:
        """
        Transcrit un audio en texte
        
        Args:
            audio_data: Données audio (webm/opus ou WAV)
            is_webm: True si les données sont au format webm/opus
        
        Returns:
            Texte transcrit
        """
        self.load_model()

        if is_webm:
            # Convertir webm en WAV
            wav_data = self.convert_webm_to_wav(audio_data)
        else:
            wav_data = audio_data

        # Sauvegarder temporairement pour Whisper
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            temp_file.write(wav_data)
            temp_path = temp_file.name

        try:
            # Transcrire avec Whisper
            result = self.model.transcribe(temp_path, language="fr")
            return result["text"].strip()
        finally:
            # Nettoyer le fichier temporaire
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    def transcribe_streaming(self, audio_chunks: list[bytes], language: str = None) -> str:
        """
        Transcrit plusieurs chunks audio (pour streaming)
        
        Args:
            audio_chunks: Liste de chunks audio webm/opus
            language: Code langue ("fr" pour français, "en" pour anglais, None pour auto-détection)
        
        Returns:
            Texte transcrit complet
        """
        if not audio_chunks:
            return ""
        
        print(f"Transcription de {len(audio_chunks)} chunks audio...")
        self.load_model()
        
        # Approche simplifiée : concaténer tous les chunks en bytes et sauvegarder
        # Les chunks MediaRecorder sont des fragments webm qui peuvent être concaténés
        combined_webm = b"".join(audio_chunks)
        print(f"Taille totale des chunks combinés: {len(combined_webm)} bytes")
        
        # Sauvegarder le webm combiné
        webm_file = tempfile.NamedTemporaryFile(suffix=".webm", delete=False)
        webm_file.write(combined_webm)
        webm_file.close()
        webm_path = webm_file.name
        
        try:
            # Convertir directement le webm en WAV
            print(f"Conversion webm vers WAV avec ffmpeg...")
            wav_data = self.convert_webm_to_wav_from_file(webm_path)
            print(f"Conversion réussie, taille WAV: {len(wav_data)} bytes")
            
            if len(wav_data) < 1000:
                print("ATTENTION: Le fichier WAV est très petit, peut-être vide")
                return ""
            
            # Sauvegarder le WAV temporairement pour Whisper
            wav_file = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
            wav_file.write(wav_data)
            wav_file.close()
            wav_path = wav_file.name
            
            try:
                # Transcrire avec Whisper avec des paramètres optimisés pour la vitesse
                print(f"Transcription Whisper du fichier WAV (langue: {language or 'auto'})...")
                result_text = self.model.transcribe(
                    wav_path, 
                    language=language,  # "fr", "en", ou None pour auto-détection
                    verbose=True,
                    task="transcribe",  # Forcer la transcription (pas la traduction)
                    temperature=0.0,  # Réduire la température pour plus de précision
                    best_of=1,  # Réduit à 1 pour améliorer la vitesse (au lieu de 2)
                    beam_size=3,  # Réduit à 3 pour améliorer la vitesse (au lieu de 5)
                )
                text = result_text["text"].strip()
                print(f"Transcription réussie: {len(text)} caractères")
                if text:
                    print(f"Texte transcrit: '{text[:100]}...'")
                else:
                    print("ATTENTION: Transcription vide!")
                    # Essayer sans spécifier la langue avec paramètres par défaut
                    print("Tentative sans spécifier la langue...")
                    result_text = self.model.transcribe(wav_path, verbose=True)
                    text = result_text["text"].strip()
                    print(f"Transcription sans langue: {len(text)} caractères")
                    if text:
                        print(f"Texte: '{text[:100]}...'")
                return text
            finally:
                # Nettoyer le fichier WAV
                if os.path.exists(wav_path):
                    os.unlink(wav_path)
        except Exception as e:
            print(f"Erreur lors de la transcription: {e}")
            import traceback
            traceback.print_exc()
            raise
        finally:
            # Nettoyer le fichier webm
            if os.path.exists(webm_path):
                os.unlink(webm_path)
    
    def convert_webm_to_wav_from_file(self, webm_path: str) -> bytes:
        """
        Convertit un fichier webm en WAV PCM via ffmpeg
        
        Args:
            webm_path: Chemin vers le fichier webm
        
        Returns:
            Données audio au format WAV PCM
        """
        # Créer un fichier temporaire pour l'output
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as output_file:
            output_path = output_file.name

        try:
            # Utiliser ffmpeg pour convertir
            result = subprocess.run(
                [
                    "ffmpeg",
                    "-i",
                    webm_path,
                    "-ar",
                    "16000",  # Sample rate 16kHz (requis par Whisper)
                    "-ac",
                    "1",  # Mono
                    "-f",
                    "wav",
                    "-y",  # Overwrite output file
                    output_path,
                ],
                check=True,
                capture_output=True,
            )

            # Lire le fichier WAV converti
            with open(output_path, "rb") as f:
                wav_data = f.read()

            return wav_data
        finally:
            # Nettoyer le fichier de sortie
            if os.path.exists(output_path):
                os.unlink(output_path)
