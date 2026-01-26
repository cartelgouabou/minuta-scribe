# Minuta - Transcription et Génération de Comptes Rendus

**Minuta** est une application web simple qui vous permet d'enregistrer vos réunions, de les transcrire automatiquement et de générer des comptes rendus professionnels en quelques clics.

## 🎯 Qu'est-ce que Minuta ?

Minuta est un outil qui :
- **Enregistre** votre voix pendant une réunion
- **Transcrit** automatiquement ce qui est dit en texte
- **Génère** un compte rendu professionnel grâce à l'intelligence artificielle
- **Exporte** le résultat en PDF ou texte

Tout fonctionne **localement** sur votre ordinateur, y compris la génération du compte rendu via Ollama avec des modèles LLM locaux.

## ✨ Fonctionnalités principales

### Page Meeting
- 🎤 Enregistrement audio depuis votre navigateur
- 📝 Transcription automatique en temps réel (français ou anglais)
- ✏️ Édition de la transcription avant génération
- 🤖 Génération de compte rendu via IA
- 💾 Export en PDF ou texte
- 📊 Statistiques en temps réel (durée, nombre de mots)

### Page Prompts
- 📋 Gestion de vos modèles de comptes rendus
- 🔍 Recherche rapide
- ➕ Création, modification et suppression de prompts

## 🚀 Installation rapide

### Avec Docker (Recommandé - Le plus simple)

**Prérequis :** Docker et Docker Compose installés sur votre ordinateur.

> 💡 **Astuce :** Si Docker n'est pas installé, vous pouvez utiliser le script `start.sh` qui vérifiera et vous proposera de l'installer automatiquement.

1. **Télécharger le projet**
   ```bash
   git clone https://github.com/cartelgouabou/minuta-scribe.git
   cd minuta-scribe
   ```
   
   > **Note :** Si vous avez GitHub CLI installé, vous pouvez aussi utiliser :
   > ```bash
   > gh repo clone cartelgouabou/minuta-scribe
   > cd minuta-scribe
   > ```

2. **Rendre les scripts exécutables (si nécessaire)**
   
   Sur Linux et macOS, vous devez rendre les scripts exécutables :
   ```bash
   chmod +x start.sh uninstall.sh
   ```
   
   > **Note :** Cette étape n'est nécessaire qu'une seule fois après le clonage du projet. Sur Windows avec Git Bash, les scripts sont généralement déjà exécutables.

3. **Lancer l'application**
   
   **Option A : Utiliser le script automatique (recommandé)**
   ```bash
   ./start.sh
   ```
   Le script vérifiera Docker, vous proposera de l'installer si nécessaire, puis lancera l'application avec Ollama.
   
   > **Note :** Aucune configuration manuelle n'est nécessaire ! Les modèles LLM (Mistral 7B et Llama 3.2 3B) sont automatiquement téléchargés au démarrage.
   
   **Option B : Lancer manuellement**
   ```bash
   cd docker
   docker-compose up --build
   ```
   
   > **Note :** Le premier lancement peut prendre plusieurs minutes pour télécharger les modèles LLM (~6.4GB au total). Les lancements suivants seront beaucoup plus rapides.

4. **Désinstaller l'application (optionnel)**
   
   Si vous souhaitez supprimer complètement Minuta de votre système :
   ```bash
   ./uninstall.sh
   ```
   
   Cette commande va :
   - Détecter automatiquement si l'application est en cours d'exécution
   - Arrêter et supprimer tous les conteneurs Minuta
   - Supprimer toutes les images Docker de Minuta
   - Supprimer tous les volumes (données backend + modèles LLM Ollama)
   - Supprimer le réseau Docker Minuta
   - Libérer environ 10-15 GB d'espace disque
   
   > **Note :** Vous devrez confirmer la désinstallation en tapant "oui". L'image Ollama ne sera supprimée que si vous le confirmez (elle peut être utilisée par d'autres projets). Le script fonctionne même si l'application tourne en arrière-plan.

5. **Ouvrir dans votre navigateur**
   - Allez sur [http://localhost](http://localhost)
   - L'application est prête !

## 📸 Aperçu de l'interface

### Page Meeting - Enregistrement et transcription

![Page Meeting - Interface principale](docs/screenshots/meeting-page.png)

*Capture d'écran de la page Meeting montrant :*
- Sélecteur de langue (Français/Anglais)
- Bouton d'enregistrement
- Statistiques en temps réel (durée, nombre de mots)
- Zone d'édition de la transcription
- Options de génération de compte rendu

### Page Prompts - Gestion des modèles

![Page Prompts - Gestion des modèles](docs/screenshots/prompts-page.png)

*Capture d'écran de la page Prompts montrant :*
- Liste des prompts disponibles
- Formulaire de création/édition
- Recherche de prompts
- Actions CRUD (Créer, Modifier, Supprimer)

## 📖 Comment utiliser Minuta

### 1. Enregistrer une réunion

1. Allez sur la page **Meeting**
2. Sélectionnez la langue (Français ou Anglais)
3. Cliquez sur **"Start Recording"**
4. Autorisez l'accès au microphone si demandé
5. Parlez normalement
6. Cliquez sur **"Stop Recording"** quand vous avez terminé

### 2. Éditer la transcription

1. La transcription apparaît automatiquement après l'arrêt de l'enregistrement
   > 💡 **Note** : Lors du premier lancement de l'application, la transcription peut prendre 30 secondes à quelques minutes car le modèle Whisper doit être chargé. Les transcriptions suivantes seront beaucoup plus rapides.
2. Vous pouvez modifier le texte directement dans la zone de texte
3. Corrigez les erreurs si nécessaire

### 3. Générer le compte rendu

1. Sélectionnez un prompt (modèle de compte rendu)
2. Choisissez le modèle LLM (Mistral 7B ou Llama 3.2 3B)
3. Cliquez sur **"Générer le compte rendu"**
4. Attendez quelques secondes (la première génération peut prendre plus de temps)
5. Le compte rendu apparaît en dessous

### 4. Exporter ou copier

- **Copier** : Cliquez sur "Copier" pour copier le texte
- **Exporter en PDF** : Cliquez sur "Exporter en PDF"
- **Exporter en texte** : Cliquez sur "Exporter en .txt"

## 🎨 Thème sombre/clair

Cliquez sur l'icône ☀️/🌙 en haut à droite pour basculer entre le thème sombre et clair.

## ❓ Problèmes courants

### "permission denied" lors de l'exécution des scripts
**Solution :** Rendez les scripts exécutables avec :
```bash
chmod +x start.sh uninstall.sh
```

### "ffmpeg not found"
**Solution :** Installez ffmpeg sur votre système (voir prérequis ci-dessus).

### "Ollama n'est pas accessible"
**Solution :** Vérifiez que le service Ollama est démarré. Les modèles sont téléchargés automatiquement au démarrage via le script `start.sh`. Si les modèles ne sont pas disponibles, ils seront téléchargés au premier usage.

### Le microphone ne fonctionne pas
**Solution :** 
- Vérifiez les permissions du navigateur
- Utilisez Chrome ou Edge (recommandé)
- Vérifiez que votre microphone fonctionne dans d'autres applications

### La transcription est vide
**Solution :**
- Vérifiez que vous parlez clairement
- Vérifiez que le microphone capte bien le son
- Essayez de parler plus près du microphone

### L'application ne démarre pas
**Solution :**
- Vérifiez que tous les prérequis sont installés (Docker, Docker Compose)
- Vérifiez que les ports 80 (frontend), 8000 (backend) et 11434 (Ollama) ne sont pas utilisés
- Consultez les messages d'erreur dans les terminaux
- Assurez-vous d'avoir au moins 8GB de RAM disponible pour les modèles LLM

### Désinstaller complètement l'application
**Solution :**
```bash
./uninstall.sh
```
Cette commande supprimera tous les conteneurs, images, volumes et réseaux Docker liés à Minuta, libérant environ 10-15 GB d'espace disque. Le script détecte automatiquement si l'application est en cours d'exécution et l'arrête avant de procéder à la désinstallation.

## 📞 Support

Pour toute question ou problème, consultez le [README technique](README_TECH.md) ou ouvrez une issue sur le repository.

## 📝 Notes importantes

- **Confidentialité** : Tout fonctionne localement sur votre ordinateur. Aucune donnée n'est envoyée vers des services cloud. La transcription utilise Whisper local et la génération de compte rendu utilise Ollama avec des modèles LLM locaux (Mistral 7B et Llama 3.2 3B).
- **Navigateurs recommandés** : Chrome ou Edge pour la meilleure expérience
- **Modèles LLM disponibles** : Vous pouvez choisir entre Mistral 7B Instruct et Llama 3.2 3B Instruct dans l'interface lors de la génération du compte rendu. Les deux modèles sont automatiquement téléchargés au démarrage via le script `start.sh`.
- **Performance** : 
  - ⏱️ **Premier lancement** : Lors du premier lancement, le téléchargement des modèles LLM peut prendre plusieurs minutes (~6.4GB au total : Mistral 4.4GB + Llama 2.0GB). La première transcription peut aussi prendre 30 secondes à quelques minutes car le modèle Whisper doit être chargé en mémoire. C'est normal, soyez patient !
  - ⚡ **Lancements suivants** : Une fois les modèles chargés, les transcriptions et générations de compte rendu sont beaucoup plus rapides.
- **Prérequis système** : 
  - RAM : Au moins 8GB recommandés (16GB pour de meilleures performances)
  - Espace disque : ~10-15GB pour les modèles LLM et les images Docker
- **Stockage** : Les transcriptions ne sont pas sauvegardées automatiquement. Exportez-les si vous voulez les conserver.

## 🎉 C'est tout !

Vous êtes prêt à utiliser Minuta. Bonne transcription !
