from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.models.prompt import Prompt
from app.services.groq_service import GroqService

router = APIRouter(prefix="/api", tags=["summary"])


class GenerateSummaryRequest(BaseModel):
    transcription: str
    prompt_id: int


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

    try:
        # Générer le compte rendu via Groq
        groq_service = GroqService()
        summary = groq_service.generate_summary(prompt.content, request.transcription)
        return GenerateSummaryResponse(summary=summary)
    except ValueError as e:
        # Erreur de configuration (clé API manquante)
        raise HTTPException(status_code=500, detail=f"Configuration error: {str(e)}")
    except Exception as e:
        # Autres erreurs
        import traceback
        error_details = traceback.format_exc()
        print(f"Erreur lors de la génération du compte rendu: {error_details}")
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")
