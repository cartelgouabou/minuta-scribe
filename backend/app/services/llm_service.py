import os
from openai import OpenAI
from typing import Optional, List
from enum import Enum


class LLMProvider(str, Enum):
    """Enum pour les différents providers LLM"""
    OLLAMA = "ollama"
    GROQ = "groq"
    VERCEL = "vercel"


class LLMService:
    """
    Service unifié pour gérer les différents providers LLM (Ollama, Groq, Vercel)
    Détecte automatiquement le provider via les variables d'environnement
    """
    
    def __init__(self):
        # Détecter le provider
        self.provider = self._detect_provider()
        self.client = self._create_client()
        self.available_models = self._get_available_models()
        
        print(f"Provider LLM détecté: {self.provider.value}")
        print(f"Modèles disponibles: {', '.join(self.available_models)}")
    
    def _detect_provider(self) -> LLMProvider:
        """Détecte le provider à utiliser selon les variables d'environnement"""
        if os.getenv("GROQ_API_KEY"):
            return LLMProvider.GROQ
        elif os.getenv("AI_GATEWAY_API_KEY"):
            return LLMProvider.VERCEL
        else:
            return LLMProvider.OLLAMA
    
    def _create_client(self) -> OpenAI:
        """Crée le client OpenAI approprié selon le provider"""
        if self.provider == LLMProvider.GROQ:
            api_key = os.getenv("GROQ_API_KEY")
            base_url = "https://api.groq.com/openai/v1"
            return OpenAI(api_key=api_key, base_url=base_url)
        
        elif self.provider == LLMProvider.VERCEL:
            api_key = os.getenv("AI_GATEWAY_API_KEY")
            base_url = "https://ai-gateway.vercel.sh/v1"
            return OpenAI(api_key=api_key, base_url=base_url)
        
        else:  # OLLAMA
            base_url = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
            # S'assurer que l'URL se termine par /v1 pour l'API OpenAI-compatible d'Ollama
            if not base_url.endswith("/v1"):
                base_url = base_url.rstrip("/") + "/v1"
            # Ollama n'utilise pas de clé API, mais le client OpenAI en requiert une
            api_key = os.getenv("OLLAMA_API_KEY", "not-needed")
            return OpenAI(base_url=base_url, api_key=api_key)
    
    def _get_available_models(self) -> List[str]:
        """Récupère la liste des modèles disponibles selon le provider"""
        # Si LLM_MODELS est défini, utiliser cette liste
        llm_models_env = os.getenv("LLM_MODELS")
        if llm_models_env:
            models = [m.strip() for m in llm_models_env.split(",") if m.strip()]
            if models:
                return models
        
        # Sinon, utiliser les modèles par défaut selon le provider
        if self.provider == LLMProvider.GROQ:
            return [
                "openai/gpt-oss-20b",
                "llama-3.3-70b-versatile",
                "qwen/qwen3-32b"
            ]
        elif self.provider == LLMProvider.VERCEL:
            return [
                "openai/gpt-oss-20b",
                "alibaba/qwen-3-30b",
                "google/gemini-2.0-flash-lite",
                "meta/llama-4-scout"
            ]
        else:  # OLLAMA
            return ["llama3.2:3b"]
    
    def get_provider(self) -> LLMProvider:
        """Retourne le provider actuel"""
        return self.provider
    
    def get_available_models(self) -> List[str]:
        """Retourne la liste des modèles disponibles"""
        return self.available_models
    
    def is_model_available(self, model: str) -> bool:
        """Vérifie si un modèle est disponible"""
        return model in self.available_models
    
    def generate_summary(self, prompt: str, transcription: str, model: Optional[str] = None) -> str:
        """
        Génère un compte rendu à partir d'un prompt et d'une transcription
        
        Args:
            prompt: Le prompt système pour guider la génération
            transcription: La transcription de la réunion
            model: Le modèle à utiliser. Si None, utilise le premier modèle disponible
        
        Returns:
            Le compte rendu généré
        """
        # Utiliser le modèle par défaut si non spécifié
        if model is None:
            model = self.available_models[0] if self.available_models else None
        
        if model is None:
            raise Exception("Aucun modèle disponible")
        
        # Vérifier que le modèle est disponible
        if not self.is_model_available(model):
            raise Exception(
                f"Modèle '{model}' non disponible. "
                f"Modèles disponibles: {', '.join(self.available_models)}"
            )
        
        try:
            full_prompt = f"{prompt}\n\nTranscription de la réunion:\n\n{transcription}\n\nGénère le compte rendu demandé:"
            
            print(f"Appel à {self.provider.value} avec le modèle {model}...")
            print(f"Longueur du prompt: {len(prompt)} caractères")
            print(f"Longueur de la transcription: {len(transcription)} caractères")
            
            # Pour Groq, l'API est légèrement différente (chat.completions.create)
            # Pour Vercel et Ollama, c'est la même API
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
                raise Exception(f"Réponse vide de {self.provider.value}")
            
            result = completion.choices[0].message.content
            print(f"Compte rendu généré avec succès ({len(result)} caractères)")
            return result
            
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            print(f"Erreur détaillée {self.provider.value}: {error_details}")
            
            error_str = str(e).lower()
            provider_name = self.provider.value.capitalize()
            
            # Vérifier différents types d'erreurs
            if "connection" in error_str or "connect" in error_str or "timeout" in error_str:
                raise Exception(
                    f"Impossible de se connecter à {provider_name}. "
                    f"Vérifiez votre connexion internet et que le service est accessible."
                )
            elif "api key" in error_str or "authentication" in error_str or "unauthorized" in error_str or "401" in error_str:
                raise Exception(
                    f"Clé API {provider_name} invalide ou expirée. "
                    f"Vérifiez votre clé API dans backend/.env et relancez start.sh pour la mettre à jour."
                )
            elif "model" in error_str and ("not found" in error_str or "invalid" in error_str or "not available" in error_str):
                raise Exception(
                    f"Modèle '{model}' non disponible sur {provider_name}. "
                    f"Modèles disponibles: {', '.join(self.available_models)}. "
                    f"Relancez start.sh pour sélectionner un autre modèle."
                )
            elif "rate limit" in error_str or "429" in error_str:
                raise Exception(
                    f"Limite de requêtes atteinte pour {provider_name}. "
                    f"Veuillez réessayer dans quelques instants."
                )
            elif "quota" in error_str or "billing" in error_str:
                raise Exception(
                    f"Quota dépassé pour {provider_name}. "
                    f"Vérifiez votre compte et votre facturation."
                )
            else:
                # Erreur générique avec plus de détails
                error_message = str(e)
                # Limiter la longueur du message d'erreur
                if len(error_message) > 200:
                    error_message = error_message[:200] + "..."
                raise Exception(f"Erreur {provider_name}: {error_message}")
