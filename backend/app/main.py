import os
from backend.app.audio_buffer import AudioBuffer
from backend.app.whisper_worker import WhisperWorker
from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, DateTime, create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime
from backend.app.ollama_client import DEFAULT_MODEL

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


# --- WEBSOCKET TRANSCRIPTION ---
@app.websocket("/transcribe")
async def transcribe_ws(websocket: WebSocket):
    await websocket.accept()

    from backend.app.audio_buffer import AudioBuffer
    buffer = AudioBuffer()

    full_text = []


    import asyncio

    def send_safe(text: str):
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = asyncio.get_event_loop()

        # accumulate transcription
        full_text.append(text)

        if websocket.client_state.value == 1:  # open
            asyncio.run_coroutine_threadsafe(
                websocket.send_text(text),
                loop
            )



    from backend.app.whisper_worker import WhisperWorker
    whisper = WhisperWorker(
        whisper_path="/Users/cartelgouabou/RD/minuta-scribe/whisper.cpp",
        model_path="/Users/cartelgouabou/RD/minuta-scribe/whisper.cpp/models/ggml-small.bin",
        audio_buffer=buffer,
        callback=send_safe
    )
    whisper.start()

    try:
        while True:
            message = await websocket.receive()
            print("RECEIVED RAW:", message)

            if message["type"] == "websocket.receive":
                if message.get("bytes") is not None:
                    buffer.append(message["bytes"])
                else:
                    print("⚠️ WARNING: Received non-bytes payload")
                    print("Payload:", message)

            elif message["type"] == "websocket.disconnect":
                print("Client disconnected")
                break

    except Exception as e:
        print("WebSocket closed:", e)

    # --- Generate automatic summary ---
    meeting_text = "\n".join(full_text)

    if meeting_text.strip():
        from backend.app.ollama_client import generate_response
        summary_prompt = (
            "Tu es un assistant expert en compte rendu de réunion. "
            "Résume le texte suivant en français, de manière claire, concise et structurée. "
            "Fournis :\n"
            "- 5 points clés\n"
            "- Décisions prises\n"
            "- Actions à mener\n"
            "Texte :\n"
            f"{meeting_text}"
        )

        summary = await generate_response(DEFAULT_MODEL, summary_prompt)

        # Send summary back to frontend
        try:
            await websocket.send_text("=== RÉSUMÉ DE RÉUNION ===\n" + summary)
        except:
            pass

    whisper.stop()
    print("connection closed")



from backend.app.ollama_client import generate_response
from pydantic import BaseModel


class SummaryRequest(BaseModel):
    text: str


@app.post("/summary")
async def generate_summary(payload: SummaryRequest):
    """
    Résume un texte à l'aide d'un LLM local via Ollama.
    """
    prompt = f"""
Tu es un assistant expert en compte rendu de réunion.

Résume ce texte de manière claire, structurée et professionnelle :
- 5 bullet points essentiels
- Décisions prises
- Actions à mener (si présentes)
- Ton neutre
- En français

Texte :
{payload.text}
"""

    response = await generate_response(DEFAULT_MODEL, prompt=prompt)
    return {"summary": response}
