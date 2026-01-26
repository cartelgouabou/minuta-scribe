import os
from openai import OpenAI
from typing import Optional


class OllamaService:
    def __init__(self):
        # URL de base pour Ollama (par défaut dans Docker)
        # Le client OpenAI ajoute automatiquement /chat/completions à la base_url
        # Il faut donc inclure /v1 dans la base_url pour Ollama
        base_url = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
        # S'assurer que l'URL se termine par /v1 pour l'API OpenAI-compatible d'Ollama
        if not base_url.endswith("/v1"):
            base_url = base_url.rstrip("/") + "/v1"
        # Ollama n'utilise pas de clé API, mais le client OpenAI en requiert une
        # On peut utiliser une clé factice
        api_key = os.getenv("OLLAMA_API_KEY", "not-needed")
        self.client = OpenAI(base_url=base_url, api_key=api_key)

    def generate_summary(self, prompt: str, transcription: str, model: str = "mistral:7b-instruct") -> str:
        """
        Génère un compte rendu à partir d'un prompt et d'une transcription
        
        Args:
            prompt: Le prompt système pour guider la génération
            transcription: La transcription de la réunion
            model: Le modèle Ollama à utiliser (par défaut: mistral:7b-instruct)
                   Options: "mistral:7b-instruct" ou "llama3.2:3b"
        
        Returns:
            Le compte rendu généré
        """
        try:
            full_prompt = f"{prompt}\n\nTranscription de la réunion:\n\n{transcription}\n\nGénère le compte rendu demandé:"
            
            print(f"Appel à Ollama avec le modèle {model}...")
            print(f"Longueur du prompt: {len(prompt)} caractères")
            print(f"Longueur de la transcription: {len(transcription)} caractères")
            
            completion = self.client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "system",
                        "content": "Tu es un assistant expert dans la rédaction de comptes rendus de réunions. Tu génères des comptes rendus clairs, structurés et professionnels en français.",
                    },
                    {
                        "role": "user",
                        "content": full_prompt,
                    },
                ],
                temperature=0.7,
                max_tokens=4096,
            )

            if not completion.choices or not completion.choices[0].message.content:
                raise Exception("Réponse vide d'Ollama")
            
            result = completion.choices[0].message.content
            print(f"Compte rendu généré avec succès ({len(result)} caractères)")
            return result
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            print(f"Erreur détaillée Ollama: {error_details}")
            # Vérifier si c'est une erreur de connexion
            if "Connection" in str(e) or "connect" in str(e).lower():
                raise Exception(f"Impossible de se connecter à Ollama. Vérifiez que le service Ollama est démarré et accessible.")
            raise Exception(f"Erreur lors de l'appel à Ollama: {str(e)}")
