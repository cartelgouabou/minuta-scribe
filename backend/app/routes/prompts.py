from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel, ConfigDict
from datetime import datetime

from app.db.database import get_db
from app.models.prompt import Prompt

router = APIRouter(prefix="/api/prompts", tags=["prompts"])


class PromptCreate(BaseModel):
    title: str
    content: str


class PromptUpdate(BaseModel):
    title: str
    content: str


class PromptResponse(BaseModel):
    id: int
    title: str
    content: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


@router.get("", response_model=List[PromptResponse])
def get_prompts(db: Session = Depends(get_db)):
    """Liste tous les prompts"""
    prompts = db.query(Prompt).all()
    return prompts


@router.get("/{prompt_id}", response_model=PromptResponse)
def get_prompt(prompt_id: int, db: Session = Depends(get_db)):
    """Récupère un prompt par son ID"""
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return prompt


@router.get("/search", response_model=List[PromptResponse])
def search_prompts(q: str = Query(..., description="Terme de recherche"), db: Session = Depends(get_db)):
    """Recherche des prompts par titre"""
    prompts = db.query(Prompt).filter(Prompt.title.ilike(f"%{q}%")).all()
    return prompts


@router.post("", response_model=PromptResponse, status_code=201)
def create_prompt(prompt_data: PromptCreate, db: Session = Depends(get_db)):
    """Crée un nouveau prompt"""
    prompt = Prompt(title=prompt_data.title, content=prompt_data.content)
    db.add(prompt)
    db.commit()
    db.refresh(prompt)
    return prompt


@router.put("/{prompt_id}", response_model=PromptResponse)
def update_prompt(
    prompt_id: int, prompt_data: PromptUpdate, db: Session = Depends(get_db)
):
    """Modifie un prompt existant"""
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    prompt.title = prompt_data.title
    prompt.content = prompt_data.content
    db.commit()
    db.refresh(prompt)
    return prompt


@router.delete("/{prompt_id}", status_code=204)
def delete_prompt(prompt_id: int, db: Session = Depends(get_db)):
    """Supprime un prompt"""
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    db.delete(prompt)
    db.commit()
    return None
