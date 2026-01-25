# Minuta - Transcription et Génération de Comptes Rendus

**Minuta** est une application web simple qui vous permet d'enregistrer vos réunions, de les transcrire automatiquement et de générer des comptes rendus professionnels en quelques clics.

## 🎯 Qu'est-ce que Minuta ?

Minuta est un outil qui :
- **Enregistre** votre voix pendant une réunion
- **Transcrit** automatiquement ce qui est dit en texte
- **Génère** un compte rendu professionnel grâce à l'intelligence artificielle
- **Exporte** le résultat en PDF ou texte

Tout fonctionne **localement** sur votre ordinateur (sauf la génération du compte rendu qui utilise une API cloud).

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

2. **Créer votre clé API Groq**
   - Allez sur [https://console.groq.com/](https://console.groq.com/)
   - Créez un compte gratuit
   - Générez une clé API
   - Copiez la clé

3. **Configurer l'application**
   
   Créez le fichier `.env` dans le dossier `backend/` :
   ```bash
   cd backend
   cp env.example .env
   # Éditez .env et ajoutez votre clé API Groq
   # GROQ_API_KEY=votre-clé-api-ici
   ```

4. **Lancer l'application**
   
   **Option A : Utiliser le script automatique (recommandé)**
   ```bash
   ./start.sh
   ```
   Le script vérifiera Docker, vous proposera de l'installer si nécessaire, puis lancera l'application.
   
   **Option B : Lancer manuellement**
   ```bash
   cd docker
   docker-compose up --build
   ```
   
   > **Note :** Docker Compose utilisera automatiquement le fichier `backend/.env` pour les variables d'environnement.

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

1. La transcription apparaît automatiquement
2. Vous pouvez modifier le texte directement dans la zone de texte
3. Corrigez les erreurs si nécessaire

### 3. Générer le compte rendu

1. Sélectionnez un prompt (modèle de compte rendu)
2. Cliquez sur **"Générer le compte rendu"**
3. Attendez quelques secondes
4. Le compte rendu apparaît en dessous

### 4. Exporter ou copier

- **Copier** : Cliquez sur "Copier" pour copier le texte
- **Exporter en PDF** : Cliquez sur "Exporter en PDF"
- **Exporter en texte** : Cliquez sur "Exporter en .txt"

## 🎨 Thème sombre/clair

Cliquez sur l'icône ☀️/🌙 en haut à droite pour basculer entre le thème sombre et clair.

## ❓ Problèmes courants

### "ffmpeg not found"
**Solution :** Installez ffmpeg sur votre système (voir prérequis ci-dessus).

### "GROQ_API_KEY not set"
**Solution :** Vérifiez que le fichier `.env` existe dans le dossier `backend/` et contient votre clé API.

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
- Vérifiez que tous les prérequis sont installés
- Vérifiez que les ports 8000 (backend) et 5173 (frontend) ne sont pas utilisés
- Consultez les messages d'erreur dans les terminaux

## 📞 Support

Pour toute question ou problème, consultez le [README technique](README_TECH.md) ou ouvrez une issue sur le repository.

## 📝 Notes importantes

- **Confidentialité** : La transcription se fait localement sur votre ordinateur. Seule la génération du compte rendu utilise une API cloud (Groq).
- **Navigateurs recommandés** : Chrome ou Edge pour la meilleure expérience
- **Performance** : La première transcription peut être plus lente (téléchargement du modèle Whisper)
- **Stockage** : Les transcriptions ne sont pas sauvegardées automatiquement. Exportez-les si vous voulez les conserver.

## 🎉 C'est tout !

Vous êtes prêt à utiliser Minuta. Bonne transcription !
