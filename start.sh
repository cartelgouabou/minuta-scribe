#!/bin/bash

# Script de démarrage rapide pour Minuta avec Docker
# Ce script vérifie Docker, propose l'installation si nécessaire, puis lance l'application
#
# Pour rendre ce script exécutable (si nécessaire):
#   chmod +x start.sh
#
# Puis lancer le script:
#   ./start.sh          # Pour installer/lancer l'application
#
# Pour désinstaller, utilisez:
#   ./uninstall.sh

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

# Fonction pour vérifier si on est dans Git Bash sur Windows
is_git_bash() {
    # Vérifier si on est dans Git Bash (MSYS)
    if [[ "$OSTYPE" == "msys" ]] || [[ -n "$MSYSTEM" ]]; then
        # Vérifier que MSYSTEM est MINGW64 ou MINGW32 (Git Bash)
        if [[ "$MSYSTEM" == "MINGW64" ]] || [[ "$MSYSTEM" == "MINGW32" ]]; then
            return 0
        fi
    fi
    return 1
}

# Fonction pour détecter le système d'exploitation
detect_os() {
    # Détecter Windows (uniquement Git Bash)
    if is_git_bash; then
        echo "windows"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            if [[ "$ID" == "ubuntu" ]] || [[ "$ID" == "debian" ]]; then
                echo "ubuntu"
            else
                echo "linux"
            fi
        else
            echo "linux"
        fi
    else
        echo "unknown"
    fi
}

# Fonction pour installer Git (qui inclut Git Bash) sur Windows
install_git_windows() {
    info "Installation de Git pour Windows (qui inclut Git Bash)..."
    echo ""
    echo "Git Bash est requis pour exécuter ce script sur Windows."
    echo ""
    echo "Pour installer Git :"
    echo "   1. Téléchargez Git depuis: https://git-scm.com/download/win"
    echo "   2. Exécutez l'installateur"
    echo "   3. Lors de l'installation, assurez-vous que 'Git Bash Here' est sélectionné"
    echo "   4. Après l'installation, relancez ce script depuis Git Bash"
    echo ""
    read -p "Voulez-vous ouvrir la page de téléchargement de Git maintenant ? (y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v start &> /dev/null; then
            start "https://git-scm.com/download/win"
        elif command -v xdg-open &> /dev/null; then
            xdg-open "https://git-scm.com/download/win"
        elif command -v open &> /dev/null; then
            open "https://git-scm.com/download/win"
        else
            info "Ouvrez votre navigateur et allez sur: https://git-scm.com/download/win"
        fi
        echo ""
        info "Après avoir installé Git :"
        echo "   1. Fermez ce terminal"
        echo "   2. Ouvrez Git Bash (cherchez 'Git Bash' dans le menu Démarrer)"
        echo "   3. Naviguez vers ce répertoire: cd $(pwd)"
        echo "   4. Relancez ce script avec: ./start.sh"
        echo ""
        read -p "Appuyez sur Entrée une fois Git installé..."
        exit 0
    else
        error "Git Bash est requis pour exécuter ce script sur Windows."
        echo "   Installez Git depuis: https://git-scm.com/download/win"
        exit 1
    fi
}

# Vérifier si on est sur Windows et dans Git Bash
if [[ "$OSTYPE" == "msys" ]] || [[ -n "$MSYSTEM" ]]; then
    if ! is_git_bash; then
        error "Ce script doit être exécuté dans Git Bash sur Windows."
        echo ""
        install_git_windows
    fi
fi

# Fonction pour installer Docker sur macOS
install_docker_macos() {
    info "Installation de Docker sur macOS..."
    
    # Vérifier si Homebrew est installé
    if ! command -v brew &> /dev/null; then
        warning "Homebrew n'est pas installé. Installation de Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    
    info "Installation de Docker Desktop via Homebrew..."
    brew install --cask docker
    
    success "Docker Desktop installé !"
    warning "⚠️  IMPORTANT: Vous devez maintenant :"
    echo "   1. Ouvrir Docker Desktop depuis le dossier Applications"
    echo "   2. Attendre que Docker démarre complètement (icône Docker dans la barre de menu)"
    echo "   3. Relancer ce script avec: ./start.sh"
    echo ""
    read -p "Appuyez sur Entrée une fois Docker Desktop démarré..."
}

# Fonction pour installer Docker sur Ubuntu/Debian
install_docker_ubuntu() {
    info "Installation de Docker sur Ubuntu/Debian..."
    
    # Vérifier si on a les droits sudo
    if ! sudo -n true 2>/dev/null; then
        warning "Cette installation nécessite des droits administrateur (sudo)"
    fi
    
    info "Mise à jour des paquets..."
    sudo apt-get update
    
    info "Installation des dépendances..."
    sudo apt-get install -y ca-certificates curl gnupg lsb-release
    
    info "Ajout de la clé GPG officielle de Docker..."
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    info "Ajout du dépôt Docker..."
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    info "Installation de Docker Engine et Docker Compose..."
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    success "Docker installé !"
    
    # Ajouter l'utilisateur au groupe docker pour éviter d'utiliser sudo
    info "Ajout de votre utilisateur au groupe docker..."
    sudo usermod -aG docker $USER
    warning "⚠️  Vous devez vous déconnecter et vous reconnecter (ou redémarrer) pour que les changements prennent effet."
    echo ""
    read -p "Voulez-vous continuer maintenant ? (vous devrez peut-être utiliser 'sudo docker' pour cette session) (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Relancez ce script après vous être reconnecté."
        exit 0
    fi
}

# Vérifier Docker
info "Vérification de Docker..."

if ! command -v docker &> /dev/null; then
    warning "Docker n'est pas installé."
    echo ""
    OS=$(detect_os)
    
    case $OS in
        macos)
            echo "Système détecté: macOS"
            echo ""
            read -p "Voulez-vous installer Docker Desktop maintenant ? (y/N) " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                install_docker_macos
                # Après installation, vérifier à nouveau
                if ! command -v docker &> /dev/null; then
                    error "Docker n'est toujours pas disponible. Assurez-vous que Docker Desktop est démarré."
                    exit 1
                fi
            else
                error "Docker est requis pour lancer l'application."
                echo "   Installez Docker manuellement depuis: https://www.docker.com/products/docker-desktop"
                exit 1
            fi
            ;;
        ubuntu)
            echo "Système détecté: Ubuntu/Debian"
            echo ""
            read -p "Voulez-vous installer Docker maintenant ? (y/N) " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                install_docker_ubuntu
            else
                error "Docker est requis pour lancer l'application."
                echo "   Installez Docker manuellement: https://docs.docker.com/engine/install/ubuntu/"
                exit 1
            fi
            ;;
        windows)
            echo "Système détecté: Windows (Git Bash)"
            echo ""
            warning "Sur Windows, Docker doit être installé via Docker Desktop."
            echo ""
            read -p "Voulez-vous ouvrir la page de téléchargement de Docker Desktop ? (y/N) " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                if command -v start &> /dev/null; then
                    start "https://www.docker.com/products/docker-desktop"
                elif command -v xdg-open &> /dev/null; then
                    xdg-open "https://www.docker.com/products/docker-desktop"
                elif command -v open &> /dev/null; then
                    open "https://www.docker.com/products/docker-desktop"
                else
                    info "Ouvrez votre navigateur et allez sur: https://www.docker.com/products/docker-desktop"
                fi
                echo ""
                info "Après avoir installé Docker Desktop :"
                echo "   1. Démarrez Docker Desktop"
                echo "   2. Attendez que Docker soit complètement démarré"
                echo "   3. Relancez ce script avec: ./start.sh"
                echo ""
                read -p "Appuyez sur Entrée une fois Docker Desktop installé et démarré..."
            else
                error "Docker est requis pour lancer l'application."
                echo "   Installez Docker Desktop depuis: https://www.docker.com/products/docker-desktop"
                exit 1
            fi
            ;;
        *)
            error "Système d'exploitation non supporté pour l'installation automatique."
            echo "   Installez Docker manuellement depuis: https://www.docker.com/get-started"
            exit 1
            ;;
    esac
else
    success "Docker est installé ($(docker --version | cut -d' ' -f3 | cut -d',' -f1))"
fi

# Vérifier que Docker fonctionne
info "Vérification que Docker fonctionne..."
if ! docker info &> /dev/null; then
    error "Docker est installé mais ne fonctionne pas."
    OS=$(detect_os)
    case $OS in
        macos)
            echo "   Sur macOS: Assurez-vous que Docker Desktop est démarré"
            ;;
        windows)
            echo "   Sur Windows: Assurez-vous que Docker Desktop est démarré et en cours d'exécution"
            ;;
        *)
            echo "   Sur Linux: Vous devrez peut-être utiliser 'sudo docker' ou vous reconnecter après avoir été ajouté au groupe docker"
            ;;
    esac
    exit 1
fi
success "Docker fonctionne correctement"

# Vérifier Docker Compose
info "Vérification de Docker Compose..."
if docker compose version &> /dev/null; then
    success "Docker Compose est disponible ($(docker compose version | head -n1 | cut -d' ' -f4))"
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    success "Docker Compose est disponible ($(docker-compose --version | cut -d' ' -f4 | cut -d',' -f1))"
    DOCKER_COMPOSE_CMD="docker-compose"
else
    error "Docker Compose n'est pas disponible."
    echo "   Installez Docker Compose ou utilisez la version intégrée à Docker (docker compose)"
    exit 1
fi

echo ""
success "Tout est prêt !"
echo ""

# Configuration du service LLM
info "Configuration du service LLM..."
echo ""
echo "Quel service LLM voulez-vous utiliser ?"
echo "   1) Ollama (par défaut, local, gratuit)"
echo "   2) Groq (API cloud, rapide et performant)"
echo "   3) Vercel AI Gateway (API cloud, accès à plusieurs providers)"
echo ""
read -p "Votre choix (1/2/3) [1]: " -r LLM_CHOICE
echo ""

# Par défaut, utiliser Ollama
if [ -z "$LLM_CHOICE" ]; then
    LLM_CHOICE=1
fi

LLM_PROVIDER=""
ENV_FILE="backend/.env"

# Fonction pour lire une API key (permet le copier-coller)
read_api_key() {
    local prompt_text=$1
    local api_key=""
    echo -n "$prompt_text: "
    # Utiliser read normal pour permettre le copier-coller facilement
    read api_key
    # Nettoyer la clé API : enlever les espaces en début/fin, les deux-points en fin, etc.
    api_key=$(echo "$api_key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed 's/:$//')
    echo "$api_key"
}

# Fonction pour obtenir tous les modèles disponibles pour un provider
get_all_models() {
    local provider=$1
    local models=()
    
    if [ "$provider" == "groq" ]; then
        models=(
            "openai/gpt-oss-20b"
            "llama-3.3-70b-versatile"
            "qwen/qwen3-32b"
        )
    elif [ "$provider" == "vercel" ]; then
        models=(
            "openai/gpt-oss-20b"
            "alibaba/qwen-3-30b"
            "google/gemini-2.0-flash-lite"
            "meta/llama-4-scout"
        )
    fi
    
    # Retourner tous les modèles séparés par des virgules
    IFS=','
    echo "${models[*]}"
    unset IFS
}

# Fonction pour lire une valeur depuis le fichier .env
read_env_value() {
    local key=$1
    local env_file=$2
    if [ -f "$env_file" ]; then
        # Chercher la ligne avec la clé, gérer les formats : KEY=value, KEY:=value, KEY= value, etc.
        grep "^${key}" "$env_file" | sed "s/^${key}[:=]*[[:space:]]*//" | sed 's/^"//;s/"$//' | sed 's/[[:space:]]*$//'
    fi
}

# Traiter le choix
case $LLM_CHOICE in
    2)
        LLM_PROVIDER="groq"
        info "Configuration de Groq..."
        echo ""
        
        # Vérifier si une clé API Groq existe déjà
        EXISTING_API_KEY=$(read_env_value "GROQ_API_KEY" "$ENV_FILE")
        EXISTING_MODELS=$(read_env_value "LLM_MODELS" "$ENV_FILE")
        
        USE_EXISTING_KEY=""
        if [ -n "$EXISTING_API_KEY" ]; then
            success "Une clé API Groq est déjà configurée."
            echo ""
            read -p "Voulez-vous utiliser la clé API existante ? (Y/n) " -n 1 -r
            echo ""
            USE_EXISTING_KEY="$REPLY"
            if [[ $USE_EXISTING_KEY =~ ^[Nn]$ ]]; then
                echo ""
                echo "Pour obtenir une nouvelle API key Groq :"
                echo "   1. Allez sur https://console.groq.com/"
                echo "   2. Créez un compte ou connectez-vous"
                echo "   3. Générez une API key depuis le dashboard"
                echo ""
                echo "Copiez-collez la nouvelle clé API ici :"
                API_KEY=$(read_api_key "")
                
                if [ -z "$API_KEY" ]; then
                    error "L'API key ne peut pas être vide."
                    exit 1
                fi
            else
                # Nettoyer la clé API existante avant de l'utiliser
                API_KEY=$(echo "$EXISTING_API_KEY" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed 's/^://;s/:$//' | sed 's/^=//;s/=$//')
                success "Utilisation de la clé API existante."
            fi
        else
            echo "Pour obtenir une API key Groq :"
            echo "   1. Allez sur https://console.groq.com/"
            echo "   2. Créez un compte ou connectez-vous"
            echo "   3. Générez une API key depuis le dashboard"
            echo ""
            echo "Copiez-collez la clé API que vous avez créée ici :"
            API_KEY=$(read_api_key "")
            
            if [ -z "$API_KEY" ]; then
                error "L'API key ne peut pas être vide."
                exit 1
            fi
        fi
        
        # Créer le répertoire backend s'il n'existe pas
        mkdir -p "$(dirname "$ENV_FILE")"
        
        # Nettoyer la clé API avant écriture (enlever espaces, deux-points, etc.)
        API_KEY=$(echo "$API_KEY" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed 's/^://;s/:$//' | sed 's/^=//;s/=$//')
        
        # Créer/mettre à jour le fichier .env
        {
            echo "# Configuration Groq"
            echo "GROQ_API_KEY=$API_KEY"
        } > "$ENV_FILE"
        
        # Utiliser tous les modèles disponibles pour Groq
        ALL_MODELS=$(get_all_models "groq")
        echo "LLM_MODELS=$ALL_MODELS" >> "$ENV_FILE"
        info "Tous les modèles Groq disponibles ont été configurés : $ALL_MODELS"
        
        success "Configuration Groq enregistrée dans backend/.env"
        ;;
    3)
        LLM_PROVIDER="vercel"
        info "Configuration de Vercel AI Gateway..."
        echo ""
        
        # Vérifier si une clé API Vercel existe déjà
        EXISTING_API_KEY=$(read_env_value "AI_GATEWAY_API_KEY" "$ENV_FILE")
        EXISTING_MODELS=$(read_env_value "LLM_MODELS" "$ENV_FILE")
        
        USE_EXISTING_KEY=""
        if [ -n "$EXISTING_API_KEY" ]; then
            success "Une clé API Vercel AI Gateway est déjà configurée."
            echo ""
            read -p "Voulez-vous utiliser la clé API existante ? (Y/n) " -n 1 -r
            echo ""
            USE_EXISTING_KEY="$REPLY"
            if [[ $USE_EXISTING_KEY =~ ^[Nn]$ ]]; then
                echo ""
                echo "Pour obtenir une nouvelle API key Vercel AI Gateway :"
                echo "   1. Allez sur https://vercel.com/"
                echo "   2. Créez un compte ou connectez-vous"
                echo "   3. Créez un AI Gateway et récupérez l'API key"
                echo ""
                echo "Copiez-collez la nouvelle clé API ici :"
                API_KEY=$(read_api_key "")
                
                if [ -z "$API_KEY" ]; then
                    error "L'API key ne peut pas être vide."
                    exit 1
                fi
            else
                # Nettoyer la clé API existante avant de l'utiliser
                API_KEY=$(echo "$EXISTING_API_KEY" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed 's/^://;s/:$//' | sed 's/^=//;s/=$//')
                success "Utilisation de la clé API existante."
            fi
        else
            echo "Pour obtenir une API key Vercel AI Gateway :"
            echo "   1. Allez sur https://vercel.com/"
            echo "   2. Créez un compte ou connectez-vous"
            echo "   3. Créez un AI Gateway et récupérez l'API key"
            echo ""
            echo "Copiez-collez la clé API que vous avez créée ici :"
            API_KEY=$(read_api_key "")
            
            if [ -z "$API_KEY" ]; then
                error "L'API key ne peut pas être vide."
                exit 1
            fi
        fi
        
        # Créer le répertoire backend s'il n'existe pas
        mkdir -p "$(dirname "$ENV_FILE")"
        
        # Nettoyer la clé API avant écriture (enlever espaces, deux-points, etc.)
        API_KEY=$(echo "$API_KEY" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed 's/^://;s/:$//' | sed 's/^=//;s/=$//')
        
        # Créer/mettre à jour le fichier .env
        {
            echo "# Configuration Vercel AI Gateway"
            echo "AI_GATEWAY_API_KEY=$API_KEY"
        } > "$ENV_FILE"
        
        # Utiliser tous les modèles disponibles pour Vercel
        ALL_MODELS=$(get_all_models "vercel")
        echo "LLM_MODELS=$ALL_MODELS" >> "$ENV_FILE"
        info "Tous les modèles Vercel disponibles ont été configurés : $ALL_MODELS"
        
        success "Configuration Vercel AI Gateway enregistrée dans backend/.env"
        ;;
    *)
        LLM_PROVIDER="ollama"
        info "Utilisation d'Ollama (par défaut, local)"
        # Ne pas créer de .env pour Ollama, utiliser les valeurs par défaut
        ;;
esac

echo ""

# Demander si l'utilisateur veut lancer l'application
read -p "Voulez-vous lancer l'application maintenant ? (Y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Nn]$ ]]; then
    info "Pour lancer l'application plus tard, exécutez:"
    echo "   cd docker"
    echo "   $DOCKER_COMPOSE_CMD up --build"
    echo ""
    echo "Ou relancez ce script: ./start.sh"
    exit 0
fi

echo ""
info "Lancement de l'application avec Docker Compose..."
echo ""

# Aller dans le dossier docker et lancer docker compose
cd docker

# Construire et lancer les conteneurs
info "Construction et démarrage des conteneurs..."
echo "   Cela peut prendre quelques minutes la première fois..."
echo ""

# Lancer les conteneurs en arrière-plan
if $DOCKER_COMPOSE_CMD up -d --build; then
    success "Conteneurs démarrés !"
    echo ""
    
    # Déterminer le provider en vérifiant le fichier .env
    LLM_PROVIDER_DETECTED="ollama"
    if [ -f "../backend/.env" ]; then
        if grep -q "^GROQ_API_KEY=" "../backend/.env"; then
            LLM_PROVIDER_DETECTED="groq"
        elif grep -q "^AI_GATEWAY_API_KEY=" "../backend/.env"; then
            LLM_PROVIDER_DETECTED="vercel"
        fi
    fi
    
    # Télécharger les modèles LLM uniquement si Ollama est utilisé
    if [ "$LLM_PROVIDER_DETECTED" == "ollama" ]; then
        # Attendre que Ollama soit prêt
        info "Attente que le service Ollama soit prêt..."
        MAX_WAIT=60
        WAIT_COUNT=0
        while ! docker exec minuta-ollama ollama list &> /dev/null; do
            if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
                warning "Timeout en attendant Ollama. Les modèles seront téléchargés au premier usage."
                break
            fi
            sleep 2
            WAIT_COUNT=$((WAIT_COUNT + 2))
            echo -n "."
        done
        echo ""
        
        # Télécharger uniquement Llama 3.2 3B Instruct
        info "Téléchargement du modèle LLM..."
        echo "   Cela peut prendre plusieurs minutes selon votre connexion..."
        echo ""
        
        info "Téléchargement de Llama 3.2 3B Instruct (2.0 GB)..."
        if docker exec minuta-ollama ollama pull llama3.2:3b; then
            success "Llama 3.2 3B Instruct téléchargé !"
        else
            warning "Erreur lors du téléchargement de Llama. Le modèle sera téléchargé au premier usage."
        fi
        echo ""
    else
        info "Utilisation d'un service LLM cloud ($LLM_PROVIDER). Aucun téléchargement de modèle nécessaire."
        echo ""
    fi
    
    success "Application lancée !"
    echo ""
    info "L'application est accessible sur: http://localhost"
    echo ""
    
    # Afficher les informations selon le provider
    if [ "$LLM_PROVIDER_DETECTED" == "ollama" ]; then
        info "Modèle LLM disponible :"
        echo "   - Llama 3.2 3B Instruct (Ollama local)"
        echo ""
        warning "Note: Ollama utilise des modèles locaux limités en taille."
        echo "   Pour les transcriptions complexes, il est recommandé d'utiliser Groq ou Vercel AI Gateway."
        echo "   Relancez start.sh et choisissez l'option 2 ou 3 pour configurer un service cloud."
    elif [ "$LLM_PROVIDER_DETECTED" == "groq" ]; then
        info "Provider LLM : Groq"
        if [ -f "../backend/.env" ]; then
            MODELS=$(grep "^LLM_MODELS=" "../backend/.env" | cut -d'=' -f2)
            if [ -n "$MODELS" ]; then
                info "Modèles configurés :"
                IFS=',' read -ra MODEL_ARRAY <<< "$MODELS"
                for model in "${MODEL_ARRAY[@]}"; do
                    echo "   - $model"
                done
            fi
        fi
    elif [ "$LLM_PROVIDER_DETECTED" == "vercel" ]; then
        info "Provider LLM : Vercel AI Gateway"
        if [ -f "../backend/.env" ]; then
            MODELS=$(grep "^LLM_MODELS=" "../backend/.env" | cut -d'=' -f2)
            if [ -n "$MODELS" ]; then
                info "Modèles configurés :"
                IFS=',' read -ra MODEL_ARRAY <<< "$MODELS"
                for model in "${MODEL_ARRAY[@]}"; do
                    echo "   - $model"
                done
            fi
        fi
    fi
    echo ""
    info "Pour voir les logs: cd docker && $DOCKER_COMPOSE_CMD logs -f"
    info "Pour arrêter l'application: cd docker && $DOCKER_COMPOSE_CMD down"
else
    error "Erreur lors du lancement de l'application"
    echo "   Vérifiez les messages d'erreur ci-dessus"
    exit 1
fi
