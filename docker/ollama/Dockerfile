# -------------------------------------------------------------------
# Dockerfile for Ollama LLM Runtime
# -------------------------------------------------------------------

# Image officielle Ollama
FROM ollama/ollama:latest

# Dossier où les modèles seront stockés
# (monté ensuite dans docker-compose)
VOLUME /root/.ollama

# Exposition du port de l'API Ollama
EXPOSE 11434

# Commande par défaut : démarrer le service Ollama
CMD ["serve"]
