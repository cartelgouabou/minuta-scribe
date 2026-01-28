#!/bin/bash

# Script de mise à jour automatique pour Minuta
# Ce script vérifie et télécharge les dernières mises à jour depuis GitHub
#
# Pour rendre ce script exécutable (si nécessaire):
#   chmod +x update.sh
#
# Puis lancer le script:
#   ./update.sh          # Pour vérifier et appliquer les mises à jour

set -e  # Arrêter en cas d'erreur

echo "🔄 Minuta - Script de mise à jour"
echo "=================================="
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

# Fonction pour mettre à jour automatiquement depuis GitHub
update_from_github() {
    # Vérifier si git est installé
    if ! command -v git &> /dev/null; then
        error "Git n'est pas installé. Impossible de vérifier les mises à jour."
        echo ""
        echo "Pour installer Git :"
        echo "   - macOS: brew install git"
        echo "   - Linux: sudo apt-get install git (Ubuntu/Debian) ou équivalent"
        echo "   - Windows: https://git-scm.com/download/win"
        return 1
    fi
    
    # Vérifier si on est dans un dépôt git
    if ! git rev-parse --git-dir &> /dev/null; then
        error "Ce répertoire n'est pas un dépôt git."
        echo ""
        echo "Pour utiliser ce script, vous devez avoir cloné le dépôt avec :"
        echo "   git clone https://github.com/cartelgouabou/minuta-scribe.git"
        return 1
    fi
    
    # Obtenir le répertoire racine du dépôt git
    GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
    if [[ -z "$GIT_ROOT" ]]; then
        error "Impossible de déterminer le répertoire racine du dépôt git."
        return 1
    fi
    
    # Se placer dans le répertoire racine du dépôt
    cd "$GIT_ROOT" || {
        error "Impossible d'accéder au répertoire du dépôt."
        return 1
    }
    
    # Déterminer la branche actuelle
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
    
    # Si on n'est sur aucune branche (detached HEAD), utiliser main par défaut
    if [[ -z "$CURRENT_BRANCH" ]] || [[ "$CURRENT_BRANCH" == "HEAD" ]]; then
        # Essayer de détecter la branche par défaut (main ou master)
        if git show-ref --verify --quiet refs/heads/main 2>/dev/null; then
            CURRENT_BRANCH="main"
        elif git show-ref --verify --quiet refs/heads/master 2>/dev/null; then
            CURRENT_BRANCH="master"
        else
            error "Impossible de déterminer la branche. Veuillez vous placer sur une branche valide."
            return 1
        fi
        info "Utilisation de la branche: $CURRENT_BRANCH"
    fi
    
    # Vérifier si on a un remote origin
    if ! git remote get-url origin &> /dev/null; then
        error "Aucun remote 'origin' configuré."
        echo ""
        echo "Pour configurer le remote, exécutez :"
        echo "   git remote add origin https://github.com/cartelgouabou/minuta-scribe.git"
        return 1
    fi
    
    info "Vérification des mises à jour sur GitHub (branche: $CURRENT_BRANCH)..."
    echo ""
    
    # Sauvegarder l'état actuel (en cas d'erreur)
    PREVIOUS_HEAD=$(git rev-parse HEAD 2>/dev/null)
    
    # Récupérer les dernières informations depuis GitHub (sans modifier le dépôt local)
    info "Connexion à GitHub..."
    if ! git fetch origin "$CURRENT_BRANCH" 2>&1; then
        error "Impossible de se connecter à GitHub pour vérifier les mises à jour."
        echo ""
        echo "Vérifiez :"
        echo "   - Votre connexion internet"
        echo "   - Que GitHub est accessible"
        echo "   - Que le remote 'origin' est correctement configuré"
        return 1
    fi
    
    # Vérifier s'il y a des mises à jour disponibles
    LOCAL_COMMIT=$(git rev-parse HEAD 2>/dev/null)
    REMOTE_COMMIT=$(git rev-parse "origin/$CURRENT_BRANCH" 2>/dev/null)
    
    if [[ -z "$LOCAL_COMMIT" ]] || [[ -z "$REMOTE_COMMIT" ]]; then
        error "Impossible de comparer les versions."
        return 1
    fi
    
    if [[ "$LOCAL_COMMIT" == "$REMOTE_COMMIT" ]]; then
        success "Votre version est déjà à jour !"
        echo ""
        info "Aucune mise à jour disponible."
        return 0
    fi
    
    # Il y a des mises à jour disponibles
    echo ""
    info "Des mises à jour sont disponibles sur GitHub !"
    echo ""
    info "Version locale :  $(git log -1 --format='%h - %s' HEAD 2>/dev/null || echo 'inconnue')"
    info "Version distante : $(git log -1 --format='%h - %s' "origin/$CURRENT_BRANCH" 2>/dev/null || echo 'inconnue')"
    echo ""
    
    # Demander confirmation à l'utilisateur
    warning "⚠️  ATTENTION : Cette opération va écraser tous vos changements locaux non commités."
    echo ""
    read -p "Voulez-vous continuer la mise à jour ? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Mise à jour annulée."
        return 0
    fi
    
    echo ""
    info "Mise à jour en cours..."
    
    # Sauvegarder les changements locaux non commités (stash) si nécessaire
    if ! git diff-index --quiet HEAD -- 2>/dev/null || ! git diff-index --cached --quiet HEAD -- 2>/dev/null; then
        info "Sauvegarde temporaire des modifications locales..."
        if git stash push -m "Auto-sauvegarde avant mise à jour automatique - $(date)" 2>&1; then
            info "Modifications locales sauvegardées (vous pouvez les récupérer avec 'git stash pop' si nécessaire)."
        else
            warning "Impossible de sauvegarder les modifications locales. Elles seront écrasées."
        fi
    fi
    
    # Faire un reset hard pour écraser les changements locaux et se mettre à jour
    if git reset --hard "origin/$CURRENT_BRANCH" 2>&1; then
        echo ""
        success "Mise à jour réussie !"
        echo ""
        info "Votre dépôt local est maintenant à jour avec GitHub."
        
        # Nettoyer les fichiers non suivis (optionnel, mais peut être utile)
        if git clean -fd 2>&1 | grep -q .; then
            info "Nettoyage des fichiers non suivis effectué."
        fi
        
        echo ""
        success "✅ Mise à jour terminée avec succès !"
        echo ""
        info "Vous pouvez maintenant lancer l'application avec :"
        echo "   ./start.sh"
        return 0
    else
        error "Erreur lors de la mise à jour. Tentative de restauration..."
        # Essayer de restaurer l'état précédent
        if [[ -n "$PREVIOUS_HEAD" ]]; then
            if git reset --hard "$PREVIOUS_HEAD" 2>&1; then
                warning "État précédent restauré."
            else
                error "Impossible de restaurer l'état précédent."
            fi
        fi
        error "La mise à jour a échoué."
        return 1
    fi
}

# Exécuter la mise à jour
if update_from_github; then
    exit 0
else
    exit 1
fi
