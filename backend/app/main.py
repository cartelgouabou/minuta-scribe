from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import os
import asyncio
import time
from concurrent.futures import ThreadPoolExecutor
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

# Service Whisper (singleton) - créé avant l'app pour précharger le modèle
whisper_service = WhisperService()
print("🤖 Préchargement du modèle Whisper (cela peut prendre quelques instants)...")
whisper_service.preload_model()
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

# Thread pool pour les transcriptions (éviter de bloquer le WebSocket)
transcription_executor = ThreadPoolExecutor(max_workers=2)


@app.get("/")
def root():
    return {"message": "Minuta API", "version": "0.1.0"}


async def transcribe_partial(chunks: list[bytes], language: str, websocket: WebSocket):
    """Transcrit les chunks de manière asynchrone et envoie le résultat partiel"""
    try:
        # Transcrire dans un thread pour ne pas bloquer
        loop = asyncio.get_event_loop()
        partial_text = await loop.run_in_executor(
            transcription_executor,
            whisper_service.transcribe_streaming,
            chunks,
            language,
            True  # is_partial=True pour les transcriptions partielles
        )
        
        if partial_text and partial_text.strip():
            try:
                await websocket.send_json({
                    "type": "partial",
                    "text": partial_text
                })
                print(f"Transcription partielle envoyée: {len(partial_text)} caractères")
            except Exception as e:
                print(f"Erreur envoi transcription partielle: {e}")
    except ValueError as e:
        # Erreurs de validation (audio trop court, etc.) - envoyer au frontend
        error_msg = str(e)
        print(f"Erreur validation transcription partielle: {error_msg}")
        try:
            await websocket.send_json({
                "type": "error",
                "message": error_msg
            })
        except:
            print("Impossible d'envoyer l'erreur, WebSocket fermé")
    except Exception as e:
        # Autres erreurs - juste logger, ne pas interrompre le flux
        print(f"Erreur transcription partielle: {e}")


@app.websocket("/ws/transcribe")
async def websocket_transcribe(websocket: WebSocket):
    """Endpoint WebSocket pour la transcription en temps réel"""
    await websocket.accept()
    
    audio_chunks = []
    chunks_for_partial = []  # Chunks accumulés depuis la dernière transcription partielle
    is_recording = True
    language = "fr"  # Par défaut français
    last_partial_time = time.time()
    partial_interval = 3.0  # Transcrire partiellement toutes les 3 secondes
    partial_task = None

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
                chunks_for_partial.append(chunk_bytes)
                print(f"Chunk audio reçu: {len(chunk_bytes)} bytes (total: {len(audio_chunks)} chunks)")
                
                # Vérifier si on doit faire une transcription partielle
                current_time = time.time()
                if current_time - last_partial_time >= partial_interval and len(chunks_for_partial) > 0:
                    # Transcrire les chunks accumulés depuis la dernière transcription partielle
                    chunks_to_transcribe = chunks_for_partial.copy()
                    chunks_for_partial = []  # Réinitialiser pour la prochaine période
                    last_partial_time = current_time
                    
                    # Lancer la transcription partielle de manière asynchrone
                    if partial_task and not partial_task.done():
                        # Annuler la tâche précédente si elle n'est pas terminée
                        partial_task.cancel()
                    partial_task = asyncio.create_task(
                        transcribe_partial(chunks_to_transcribe, language, websocket)
                    )

        # Attendre que la dernière transcription partielle soit terminée
        if partial_task and not partial_task.done():
            try:
                await partial_task
            except asyncio.CancelledError:
                pass

        # Transcription finale - combiner tous les chunks en un seul fichier
        if audio_chunks:
            try:
                total_bytes = sum(len(chunk) for chunk in audio_chunks)
                print(f"Transcription finale de {len(audio_chunks)} chunks audio ({total_bytes} bytes total)...")
                
                # Transcrire dans un thread pour ne pas bloquer
                loop = asyncio.get_event_loop()
                final_text = await loop.run_in_executor(
                    transcription_executor,
                    whisper_service.transcribe_streaming,
                    audio_chunks,
                    language
                )
                
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
