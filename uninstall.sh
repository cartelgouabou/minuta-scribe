#!/bin/bash

# Script de désinstallation de Minuta
# Ce script supprime complètement Minuta de votre système Docker
#
# Pour rendre ce script exécutable (si nécessaire):
#   chmod +x uninstall.sh
#
# Puis lancer le script:
#   ./uninstall.sh

set -e  # Arrêter en cas d'erreur

echo "🗑️  Minuta - Désinstallation"
echo "=============================="
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

# Vérifier Docker
info "Vérification de Docker..."
if ! command -v docker &> /dev/null; then
    error "Docker n'est pas installé."
    echo "   Minuta ne semble pas être installé sur ce système."
    exit 1
fi

if ! docker info &> /dev/null; then
    error "Docker est installé mais ne fonctionne pas."
    echo "   Sur macOS: Assurez-vous que Docker Desktop est démarré"
    echo "   Sur Linux: Vous devrez peut-être utiliser 'sudo docker'"
    exit 1
fi
success "Docker fonctionne correctement"

# Vérifier Docker Compose
info "Vérification de Docker Compose..."
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    error "Docker Compose n'est pas disponible."
    exit 1
fi
success "Docker Compose est disponible"

echo ""

# Détecter l'état de l'application
info "Vérification de l'état de l'application..."
MINUTA_CONTAINERS=$(docker ps -a --filter "name=minuta-" --format "{{.Names}}" 2>/dev/null || true)
RUNNING_CONTAINERS=$(docker ps --filter "name=minuta-" --format "{{.Names}}" 2>/dev/null || true)

if [ -n "$RUNNING_CONTAINERS" ]; then
    warning "L'application Minuta est actuellement en cours d'exécution."
    echo ""
    info "Conteneurs actifs :"
    echo "$RUNNING_CONTAINERS" | while read -r container; do
        echo "   - $container"
    done
    echo ""
    info "Ces conteneurs seront automatiquement arrêtés avant la désinstallation."
elif [ -n "$MINUTA_CONTAINERS" ]; then
    info "Des conteneurs Minuta existent mais ne sont pas en cours d'exécution."
else
    info "Aucun conteneur Minuta trouvé."
fi
echo ""

# Afficher ce qui sera supprimé
warning "⚠️  ATTENTION : Cette action va supprimer :"
echo "   - Tous les conteneurs Minuta"
echo "   - Toutes les images Docker de Minuta"
echo "   - Tous les volumes (données backend + modèles LLM Ollama)"
echo "   - Le réseau Docker Minuta"
echo ""
warning "⚠️  Cela libérera environ 10-15 GB d'espace disque."
echo ""

# Demander confirmation
read -p "Êtes-vous sûr de vouloir désinstaller Minuta ? (oui/non) " -r
echo ""

if [[ ! $REPLY =~ ^[Oo][Uu][Ii]$ ]]; then
    info "Désinstallation annulée."
    exit 0
fi

echo ""
info "Désinstallation de Minuta..."
echo ""

# Aller dans le dossier docker
if [ -d "docker" ]; then
    cd docker
else
    error "Le dossier docker n'existe pas. Êtes-vous dans le bon répertoire ?"
    exit 1
fi

# Arrêter et supprimer les conteneurs
info "Arrêt et suppression des conteneurs..."
if $DOCKER_COMPOSE_CMD down 2>/dev/null; then
    success "Conteneurs arrêtés et supprimés"
else
    # Essayer d'arrêter manuellement les conteneurs si docker-compose down échoue
    if [ -n "$MINUTA_CONTAINERS" ]; then
        echo "$MINUTA_CONTAINERS" | while read -r container; do
            if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
                docker stop "$container" 2>/dev/null && success "Conteneur arrêté: $container" || warning "Impossible d'arrêter: $container"
            fi
            docker rm "$container" 2>/dev/null && success "Conteneur supprimé: $container" || warning "Impossible de supprimer: $container"
        done
    else
        warning "Aucun conteneur à arrêter ou erreur lors de l'arrêt"
    fi
fi
echo ""

# Supprimer les images Docker
info "Suppression des images Docker..."

# Détecter et supprimer toutes les images contenant "minuta" dans le nom
MINUTA_IMAGES=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep -i "minuta" || true)

if [ -n "$MINUTA_IMAGES" ]; then
    echo "$MINUTA_IMAGES" | while read -r image; do
        if docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^${image}$"; then
            if docker rmi -f "$image" 2>/dev/null; then
                success "Image supprimée: $image"
            else
                warning "Impossible de supprimer l'image: $image (peut-être utilisée ailleurs)"
            fi
        fi
    done
else
    info "Aucune image Minuta trouvée"
fi

# Demander si on veut supprimer Ollama (peut être utilisé par d'autres projets)
if docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^ollama/ollama:latest$"; then
    OLLAMA_IN_USE=$(docker ps -a --filter "ancestor=ollama/ollama:latest" --format "{{.Names}}" | grep -v "minuta-ollama" || true)
    if [ -z "$OLLAMA_IN_USE" ]; then
        echo ""
        read -p "Voulez-vous aussi supprimer l'image Ollama ? (elle peut être utilisée par d'autres projets) (y/N) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if docker rmi -f ollama/ollama:latest 2>/dev/null; then
                success "Image Ollama supprimée"
            else
                warning "Impossible de supprimer l'image Ollama (peut-être utilisée ailleurs)"
            fi
        fi
    else
        info "Image Ollama conservée (utilisée par d'autres conteneurs: $OLLAMA_IN_USE)"
    fi
fi
echo ""

# Supprimer les volumes (détection automatique)
info "Suppression des volumes..."
VOLUMES_TO_REMOVE=(
    "minuta-scribe_backend_data"
    "minuta-scribe_ollama_data"
    "docker_backend_data"
    "docker_ollama_data"
    "backend_data"
    "ollama_data"
)

# Détecter automatiquement tous les volumes contenant "minuta", "backend_data" ou "ollama_data"
DETECTED_VOLUMES=$(docker volume ls --format "{{.Name}}" | grep -E "(minuta|backend_data|ollama_data)" || true)

VOLUMES_FOUND=false
for volume in "${VOLUMES_TO_REMOVE[@]}"; do
    if docker volume ls --format "{{.Name}}" | grep -q "^${volume}$"; then
        VOLUMES_FOUND=true
        if docker volume rm "$volume" 2>/dev/null; then
            success "Volume supprimé: $volume"
        else
            warning "Impossible de supprimer le volume: $volume"
        fi
    fi
done

# Supprimer les volumes détectés automatiquement
if [ -n "$DETECTED_VOLUMES" ]; then
    echo "$DETECTED_VOLUMES" | while read -r volume; do
        # Vérifier que le volume n'a pas déjà été supprimé et n'est pas dans la liste
        if docker volume ls --format "{{.Name}}" | grep -q "^${volume}$"; then
            # Vérifier si le volume n'est pas déjà dans VOLUMES_TO_REMOVE
            SKIP=false
            for v in "${VOLUMES_TO_REMOVE[@]}"; do
                if [ "$v" == "$volume" ]; then
                    SKIP=true
                    break
                fi
            done
            if [ "$SKIP" = false ]; then
                if docker volume rm "$volume" 2>/dev/null; then
                    success "Volume supprimé: $volume"
                else
                    warning "Impossible de supprimer le volume: $volume"
                fi
            fi
        fi
    done
fi

if [ "$VOLUMES_FOUND" = false ] && [ -z "$DETECTED_VOLUMES" ]; then
    info "Aucun volume Minuta trouvé"
fi
echo ""

# Supprimer le réseau (détection automatique)
info "Suppression du réseau Docker..."
DETECTED_NETWORKS=$(docker network ls --format "{{.Name}}" | grep -E "(minuta|minuta-network)" || true)

if [ -n "$DETECTED_NETWORKS" ]; then
    echo "$DETECTED_NETWORKS" | while read -r network; do
        if docker network rm "$network" 2>/dev/null; then
            success "Réseau supprimé: $network"
        else
            warning "Impossible de supprimer le réseau: $network"
        fi
    done
else
    info "Aucun réseau Minuta trouvé"
fi
echo ""

# Nettoyage des images non utilisées (optionnel)
info "Nettoyage des images Docker non utilisées..."
read -p "Voulez-vous supprimer toutes les images Docker non utilisées ? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if docker image prune -af; then
        success "Images non utilisées supprimées"
    else
        warning "Erreur lors du nettoyage des images"
    fi
fi
echo ""

success "✅ Désinstallation terminée !"
echo ""
info "Minuta a été complètement supprimé de votre système."
echo ""
info "Pour réinstaller, exécutez simplement: ./start.sh"
echo ""
