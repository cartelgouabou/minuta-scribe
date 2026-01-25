from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import os
from dotenv import load_dotenv

from app.db.database import init_db
from app.db.seed import seed_prompts
from app.routes import prompts, summary
from app.services.whisper_service import WhisperService

# Charger les variables d'environnement
load_dotenv()

# Initialiser la base de données et seed les prompts au démarrage
print("🚀 Démarrage de l'application Minuta...")
print("📦 Initialisation de la base de données...")
init_db()
print("🌱 Seed des prompts par défaut...")
seed_prompts()
print("✅ Application prête!")

app = FastAPI(title="Minuta API", version="0.1.0")

# CORS middleware
# Autoriser les origines pour développement local et Docker
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative dev server
        "http://localhost",        # Docker Nginx
        "http://localhost:80",    # Docker Nginx (explicit)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclure les routes
app.include_router(prompts.router)
app.include_router(summary.router)

# Service Whisper (singleton)
whisper_service = WhisperService()


@app.get("/")
def root():
    return {"message": "Minuta API", "version": "0.1.0"}


@app.websocket("/ws/transcribe")
async def websocket_transcribe(websocket: WebSocket):
    """Endpoint WebSocket pour la transcription en temps réel"""
    await websocket.accept()
    
    audio_chunks = []
    is_recording = True
    last_partial_time = 0
    language = "fr"  # Par défaut français
    import time

    try:
        while is_recording:
            # Recevoir les données (peut être du JSON ou des bytes)
            try:
                data = await websocket.receive()
            except WebSocketDisconnect:
                is_recording = False
                break

            if "text" in data:
                # Message texte (ex: {"type": "stop"} ou {"language": "fr"})
                try:
                    message = json.loads(data["text"])
                    if message.get("type") == "stop":
                        is_recording = False
                        break
                    elif "language" in message:
                        language = message["language"]
                        print(f"Langue sélectionnée: {language}")
                except (json.JSONDecodeError, KeyError):
                    pass
            elif "bytes" in data:
                # Chunk audio (webm/opus)
                chunk_bytes = data["bytes"]
                audio_chunks.append(chunk_bytes)
                print(f"Chunk audio reçu: {len(chunk_bytes)} bytes (total: {len(audio_chunks)} chunks)")
                
                # Transcription partielle toutes les 15 secondes (environ 15 chunks à 100ms)
                current_time = time.time()
                if current_time - last_partial_time >= 15.0 and len(audio_chunks) >= 15:
                    try:
                        # Transcrire les 15 derniers chunks (environ 1.5 secondes d'audio)
                        chunks_to_transcribe = audio_chunks[-15:]
                        partial_text = whisper_service.transcribe_streaming(chunks_to_transcribe, language=language)
                        if partial_text.strip():
                            await websocket.send_json({
                                "type": "partial",
                                "text": partial_text
                            })
                            print(f"Transcription partielle envoyée: '{partial_text[:50]}...'")
                        last_partial_time = current_time
                    except Exception as e:
                        print(f"Erreur transcription partielle: {e}")
                        # Ne pas bloquer si la transcription partielle échoue

        # Transcription finale - combiner tous les chunks en un seul fichier
        if audio_chunks:
            try:
                total_bytes = sum(len(chunk) for chunk in audio_chunks)
                print(f"Transcription finale de {len(audio_chunks)} chunks audio ({total_bytes} bytes total)...")
                final_text = whisper_service.transcribe_streaming(audio_chunks, language=language)
                
                # Vérifier si la connexion WebSocket est encore ouverte
                try:
                    if final_text and final_text.strip():
                        await websocket.send_json({
                            "type": "final",
                            "text": final_text
                        })
                        print(f"Transcription finale envoyée: {len(final_text)} caractères - '{final_text[:50]}...'")
                    else:
                        print("Transcription finale vide ou invalide")
                        try:
                            await websocket.send_json({
                                "type": "error",
                                "message": "La transcription est vide. Vérifiez que vous avez bien parlé dans le microphone."
                            })
                        except:
                            print("Impossible d'envoyer l'erreur, WebSocket fermé")
                except Exception as send_error:
                    print(f"Erreur lors de l'envoi du résultat: {send_error}")
            except Exception as e:
                print(f"Erreur transcription finale: {e}")
                import traceback
                traceback.print_exc()
                try:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Erreur lors de la transcription: {str(e)}"
                    })
                except:
                    print("Impossible d'envoyer l'erreur, WebSocket fermé")
        else:
            print("Aucun chunk audio reçu")
            try:
                await websocket.send_json({
                    "type": "error",
                    "message": "Aucun audio reçu"
                })
            except:
                print("Impossible d'envoyer l'erreur, WebSocket fermé")
    except WebSocketDisconnect:
        print("Client WebSocket déconnecté")
    except Exception as e:
        print(f"Erreur WebSocket: {e}")
        import traceback
        traceback.print_exc()
        try:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })
        except:
            pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
