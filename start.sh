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

# Fonction pour détecter le système d'exploitation
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
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
    echo "   Sur macOS: Assurez-vous que Docker Desktop est démarré"
    echo "   Sur Linux: Vous devrez peut-être utiliser 'sudo docker' ou vous reconnecter après avoir été ajouté au groupe docker"
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
    
    # Télécharger les modèles LLM
    info "Téléchargement des modèles LLM..."
    echo "   Cela peut prendre plusieurs minutes selon votre connexion..."
    echo ""
    
    info "Téléchargement de Mistral 7B Instruct (4.4 GB)..."
    if docker exec minuta-ollama ollama pull mistral:7b-instruct; then
        success "Mistral 7B Instruct téléchargé !"
    else
        warning "Erreur lors du téléchargement de Mistral. Le modèle sera téléchargé au premier usage."
    fi
    echo ""
    
    info "Téléchargement de Llama 3.2 3B Instruct (2.0 GB)..."
    if docker exec minuta-ollama ollama pull llama3.2:3b; then
        success "Llama 3.2 3B Instruct téléchargé !"
    else
        warning "Erreur lors du téléchargement de Llama. Le modèle sera téléchargé au premier usage."
    fi
    echo ""
    
    success "Application lancée !"
    echo ""
    info "L'application est accessible sur: http://localhost"
    echo ""
    info "Modèles LLM disponibles :"
    echo "   - Mistral 7B Instruct"
    echo "   - Llama 3.2 3B Instruct"
    echo ""
    info "Pour voir les logs: cd docker && $DOCKER_COMPOSE_CMD logs -f"
    info "Pour arrêter l'application: cd docker && $DOCKER_COMPOSE_CMD down"
else
    error "Erreur lors du lancement de l'application"
    echo "   Vérifiez les messages d'erreur ci-dessus"
    exit 1
fi
