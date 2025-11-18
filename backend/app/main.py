from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, DateTime, create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime

app = FastAPI()

# --- DATABASE SETUP ---
DATABASE_URL = "sqlite:///./data/db.sqlite3"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- MODEL ---
class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    template = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# --- SCHEMAS ---
class PromptCreate(BaseModel):
    name: str
    template: str

class PromptUpdate(BaseModel):
    name: str | None = None
    template: str | None = None

# --- CRUD ROUTES ---
@app.post("/prompts")
def create_prompt(prompt: PromptCreate):
    db = SessionLocal()
    db_prompt = Prompt(
        name=prompt.name,
        template=prompt.template
    )
    db.add(db_prompt)
    db.commit()
    db.refresh(db_prompt)
    return db_prompt

@app.get("/prompts")
def get_prompts():
    db = SessionLocal()
    return db.query(Prompt).all()

@app.get("/prompts/{prompt_id}")
def get_prompt(prompt_id: int):
    db = SessionLocal()
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return prompt

@app.put("/prompts/{prompt_id}")
def update_prompt(prompt_id: int, data: PromptUpdate):
    db = SessionLocal()
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    if data.name is not None:
        prompt.name = data.name
    if data.template is not None:
        prompt.template = data.template

    db.commit()
    db.refresh(prompt)
    return prompt

@app.delete("/prompts/{prompt_id}")
def delete_prompt(prompt_id: int):
    db = SessionLocal()
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    db.delete(prompt)
    db.commit()
    return {"deleted": True}

@app.get("/ping")
async def ping():
    return {"status": "ok"}


# --- WEBSOCKET TRANSCRIPTION (SIMULATED STREAMING) ---
@app.websocket("/transcribe")
async def transcribe_ws(websocket: WebSocket):
    await websocket.accept()
    chunk_index = 0

    try:
        while True:
            audio_chunk = await websocket.receive_bytes()
            chunk_index += 1

            # Future integration: send chunk to whisper.cpp streaming
            # For now simulate a transcription result
            text = f"[Chunk {chunk_index}] Transcription simulée"

            await websocket.send_text(text)

    except Exception as e:
        print("WebSocket closed:", e)
