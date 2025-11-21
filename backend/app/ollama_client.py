import httpx

OLLAMA_HOST = "http://localhost:11434"

# === MODEL SWITCH ===
DEFAULT_MODEL = "llama3.2:3b"
# AUTRES OPTIONS DISPONIBLES :
# DEFAULT_MODEL = "gemma2:2b"
# DEFAULT_MODEL = "neural-chat:7b-v3-q4_0"
# DEFAULT_MODEL = "mistral:7b-instruct"   # ❌ trop lourd

async def generate_response(model: str, prompt: str):
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(f"{OLLAMA_HOST}/api/generate", json=payload)
        response.raise_for_status()
        data = response.json()
        return data.get("response", "").strip()
