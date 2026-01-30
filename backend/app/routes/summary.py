from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from dotenv import load_dotenv
import os

from app.db.database import get_db
from app.models.prompt import Prompt
from app.services.llm_service import LLMService

router = APIRouter(prefix="/api", tags=["summary"])

# Service LLM global (singleton)
_llm_service: LLMService = None


def get_llm_service() -> LLMService:
    """Retourne le service LLM (singleton)"""
    global _llm_service
    
    # S'assurer que le .env est chargé (au cas où il n'aurait pas été chargé au démarrage)
    # Chercher le fichier .env dans le répertoire backend
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    env_path = os.path.join(backend_dir, '.env')
    if os.path.exists(env_path):
        load_dotenv(env_path, override=True)
    else:
        # Essayer aussi le répertoire courant
        load_dotenv(override=True)
    
    # Créer le service seulement s'il n'existe pas encore
    # Le service sera recréé au redémarrage du backend si la config change
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service


class GenerateSummaryRequest(BaseModel):
    transcription: str
    prompt_id: int
    model: str = None  # Si None, utilise le modèle par défaut du provider


class GenerateSummaryResponse(BaseModel):
    summary: str


class ModelsResponse(BaseModel):
    provider: str
    models: List[str]
    default_model: str


@router.get("/models", response_model=ModelsResponse)
def get_models():
    """Retourne les modèles disponibles selon le provider configuré"""
    try:
        llm_service = get_llm_service()
        models = llm_service.get_available_models()
        default_model = models[0] if models else None
        
        return ModelsResponse(
            provider=llm_service.get_provider().value,
            models=models,
            default_model=default_model
        )
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Erreur lors de la récupération des modèles: {error_details}")
        raise HTTPException(status_code=500, detail=f"Error getting models: {str(e)}")


@router.post("/generate-summary", response_model=GenerateSummaryResponse)
def generate_summary(
    request: GenerateSummaryRequest, db: Session = Depends(get_db)
):
    """Génère un compte rendu à partir d'une transcription et d'un prompt"""
    # Récupérer le prompt
    prompt = db.query(Prompt).filter(Prompt.id == request.prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    # Valider que la transcription n'est pas vide
    if not request.transcription or not request.transcription.strip():
        raise HTTPException(status_code=400, detail="Transcription cannot be empty")

    try:
        # Obtenir le service LLM
        llm_service = get_llm_service()
        
        # Si aucun modèle spécifié, utiliser le modèle par défaut
        model = request.model
        if model is None:
            available_models = llm_service.get_available_models()
            if not available_models:
                raise HTTPException(status_code=500, detail="Aucun modèle disponible")
            model = available_models[0]
        
        # Valider le modèle
        if not llm_service.is_model_available(model):
            available_models = llm_service.get_available_models()
            raise HTTPException(
                status_code=400, 
                detail=f"Modèle invalide. Modèles disponibles: {', '.join(available_models)}"
            )

        # Générer le compte rendu
        summary = llm_service.generate_summary(
            prompt.content, 
            request.transcription, 
            model=model
        )
        return GenerateSummaryResponse(summary=summary)
    except HTTPException:
        raise
    except Exception as e:
        # Autres erreurs
        import traceback
        error_details = traceback.format_exc()
        print(f"Erreur lors de la génération du compte rendu: {error_details}")
        # Utiliser le message d'erreur de l'exception si disponible, sinon un message générique
        error_message = str(e) if str(e) else "Erreur inconnue lors de la génération du compte rendu"
        raise HTTPException(status_code=500, detail=error_message)
