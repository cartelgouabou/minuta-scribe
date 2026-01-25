#!/bin/bash

# Script de démarrage rapide pour Minuta
# Ce script vérifie les prérequis, installe les dépendances et peut lancer l'application
#
# Pour rendre ce script exécutable (si nécessaire):
#   chmod +x start.sh
#
# Puis lancer le script:
#   ./start.sh

set -e  # Arrêter en cas d'erreur

echo "🚀 Minuta - Script de démarrage rapide"
echo "======================================"
echo ""

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier les prérequis
info "Vérification des prérequis..."

# Vérifier Python
if ! command -v python3 &> /dev/null; then
    error "Python 3 n'est pas installé."
    echo "   Installez Python 3.10+ depuis https://www.python.org/downloads/"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
if [ "$(printf '%s\n' "3.10" "$PYTHON_VERSION" | sort -V | head -n1)" != "3.10" ]; then
    warning "Python $PYTHON_VERSION détecté. Python 3.10+ est recommandé."
fi

# Vérifier Poetry
if ! command -v poetry &> /dev/null; then
    error "Poetry n'est pas installé."
    echo "   Installez-le avec: curl -sSL https://install.python-poetry.org | python3 -"
    echo "   Ou avec pip: pip install poetry"
    exit 1
fi
success "Poetry est installé ($(poetry --version))"

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    error "Node.js n'est pas installé."
    echo "   Installez Node.js 18+ depuis https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    warning "Node.js v$(node --version) détecté. Node.js 18+ est recommandé."
else
    success "Node.js est installé ($(node --version))"
fi

# Vérifier npm
if ! command -v npm &> /dev/null; then
    error "npm n'est pas installé."
    exit 1
fi
success "npm est installé ($(npm --version))"

# Vérifier ffmpeg
if ! command -v ffmpeg &> /dev/null; then
    warning "ffmpeg n'est pas installé. La transcription ne fonctionnera pas."
    echo "   Installez-le avec:"
    echo "   - macOS: brew install ffmpeg"
    echo "   - Ubuntu/Debian: sudo apt-get install ffmpeg"
    echo "   - Windows: Téléchargez depuis https://ffmpeg.org/download.html"
else
    success "ffmpeg est installé ($(ffmpeg -version | head -n1 | cut -d' ' -f3))"
fi

echo ""

# Vérifier le fichier .env
info "Vérification de la configuration..."

if [ ! -f "backend/.env" ]; then
    warning "Le fichier backend/.env n'existe pas."
    
    if [ -f "backend/env.example" ]; then
        info "Création du fichier .env à partir de env.example..."
        cp backend/env.example backend/.env
        warning "⚠️  IMPORTANT: Éditez backend/.env et ajoutez votre clé GROQ_API_KEY"
        echo "   Obtenez votre clé sur: https://console.groq.com/"
        echo ""
        read -p "Voulez-vous continuer sans configurer la clé API maintenant? (y/N) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            info "Ouvrez backend/.env dans un éditeur et ajoutez votre GROQ_API_KEY"
            exit 0
        fi
    else
        error "Le fichier env.example n'existe pas."
        echo "   Créez manuellement backend/.env avec: GROQ_API_KEY=your-key-here"
        exit 1
    fi
else
    success "Le fichier backend/.env existe"
    
    # Vérifier si GROQ_API_KEY est défini
    if ! grep -q "GROQ_API_KEY=.*[^your-groq-api-key-here]" backend/.env 2>/dev/null; then
        if grep -q "GROQ_API_KEY=your-groq-api-key-here" backend/.env 2>/dev/null; then
            warning "GROQ_API_KEY n'est pas configuré dans backend/.env"
        fi
    else
        success "GROQ_API_KEY est configuré"
    fi
fi

echo ""
info "Installation des dépendances..."
echo ""

# Backend
info "Installation des dépendances backend (Poetry)..."
cd backend
if poetry install; then
    success "Dépendances backend installées"
else
    error "Échec de l'installation des dépendances backend"
    exit 1
fi
cd ..

# Frontend
info "Installation des dépendances frontend (npm)..."
cd frontend
if npm install; then
    success "Dépendances frontend installées"
else
    error "Échec de l'installation des dépendances frontend"
    exit 1
fi
cd ..

echo ""
success "Toutes les dépendances sont installées!"
echo ""

# Demander si l'utilisateur veut lancer l'application
echo "======================================"
echo "Options de démarrage:"
echo ""
echo "1. Lancer l'application en mode développement (2 terminaux)"
echo "2. Utiliser Docker (recommandé pour production)"
echo "3. Afficher les instructions seulement"
echo ""
read -p "Choisissez une option (1-3) [3]: " choice
choice=${choice:-3}

case $choice in
    1)
        echo ""
        info "Pour lancer l'application, ouvrez 2 terminaux:"
        echo ""
        echo "Terminal 1 (Backend):"
        echo "  cd backend"
        echo "  poetry run uvicorn app.main:app --reload --port 8000"
        echo ""
        echo "Terminal 2 (Frontend):"
        echo "  cd frontend"
        echo "  npm run dev"
        echo ""
        echo "Puis ouvrez http://localhost:5173 dans votre navigateur"
        echo ""
        read -p "Voulez-vous lancer le backend maintenant? (y/N) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            info "Lancement du backend..."
            cd backend
            poetry run uvicorn app.main:app --reload --port 8000
        fi
        ;;
    2)
        echo ""
        info "Pour utiliser Docker:"
        echo "  cd docker"
        echo "  echo 'GROQ_API_KEY=your-key-here' > .env"
        echo "  docker-compose up --build"
        echo ""
        echo "Puis ouvrez http://localhost dans votre navigateur"
        ;;
    3)
        echo ""
        info "Instructions de démarrage:"
        echo ""
        echo "Mode développement (2 terminaux):"
        echo "  Terminal 1: cd backend && poetry run uvicorn app.main:app --reload --port 8000"
        echo "  Terminal 2: cd frontend && npm run dev"
        echo "  Navigateur: http://localhost:5173"
        echo ""
        echo "Mode Docker:"
        echo "  cd docker"
        echo "  echo 'GROQ_API_KEY=your-key-here' > .env"
        echo "  docker-compose up --build"
        echo "  Navigateur: http://localhost"
        echo ""
        echo "Documentation:"
        echo "  - Utilisateur: README.md"
        echo "  - Développeur: README_TECH.md"
        ;;
    *)
        error "Option invalide"
        exit 1
        ;;
esac

echo ""
success "Script terminé!"
