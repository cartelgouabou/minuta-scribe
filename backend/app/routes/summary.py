from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.models.prompt import Prompt
from app.services.ollama_service import OllamaService

router = APIRouter(prefix="/api", tags=["summary"])


class GenerateSummaryRequest(BaseModel):
    transcription: str
    prompt_id: int
    model: str = "mistral:7b-instruct"  # Par défaut Mistral, options: "mistral:7b-instruct" ou "llama3.2:3b"


class GenerateSummaryResponse(BaseModel):
    summary: str


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

    # Valider le modèle
    valid_models = ["mistral:7b-instruct", "llama3.2:3b"]
    if request.model not in valid_models:
        raise HTTPException(
            status_code=400, 
            detail=f"Modèle invalide. Modèles disponibles: {', '.join(valid_models)}"
        )

    try:
        # Générer le compte rendu via Ollama
        ollama_service = OllamaService()
        summary = ollama_service.generate_summary(
            prompt.content, 
            request.transcription, 
            model=request.model
        )
        return GenerateSummaryResponse(summary=summary)
    except Exception as e:
        # Autres erreurs
        import traceback
        error_details = traceback.format_exc()
        print(f"Erreur lors de la génération du compte rendu: {error_details}")
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")
