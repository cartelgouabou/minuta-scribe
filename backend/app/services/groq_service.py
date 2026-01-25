import os
from groq import Groq
from typing import Optional


class GroqService:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is not set")
        self.client = Groq(api_key=api_key)

    def generate_summary(self, prompt: str, transcription: str, model: str = "llama-3.1-8b-instant") -> str:
        """
        Génère un compte rendu à partir d'un prompt et d'une transcription
        
        Args:
            prompt: Le prompt système pour guider la génération
            transcription: La transcription de la réunion
            model: Le modèle Groq à utiliser (par défaut: llama-3.1-8b-instant)
        
        Returns:
            Le compte rendu généré
        """
        try:
            # Vérifier que la clé API est bien configurée
            api_key = os.getenv("GROQ_API_KEY")
            if not api_key or api_key == "your-groq-api-key-here":
                raise ValueError("GROQ_API_KEY n'est pas configurée. Vérifiez votre fichier .env")
            
            full_prompt = f"{prompt}\n\nTranscription de la réunion:\n\n{transcription}\n\nGénère le compte rendu demandé:"
            
            print(f"Appel à l'API Groq avec le modèle {model}...")
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
                raise Exception("Réponse vide de l'API Groq")
            
            result = completion.choices[0].message.content
            print(f"Compte rendu généré avec succès ({len(result)} caractères)")
            return result
        except ValueError as e:
            # Erreur de configuration
            raise e
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            print(f"Erreur détaillée API Groq: {error_details}")
            raise Exception(f"Erreur lors de l'appel à l'API Groq: {str(e)}")
