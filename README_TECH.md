# Minuta - Documentation Technique

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Stack technique](#stack-technique)
4. [Structure du projet](#structure-du-projet)
5. [Flux de données](#flux-de-données)
6. [Schémas](#schémas)
7. [Installation et développement](#installation-et-développement)
8. [Configuration](#configuration)
9. [API Documentation](#api-documentation)
10. [Tests](#tests)
11. [Déploiement](#déploiement)
12. [Contributions](#contributions)

---

## Vue d'ensemble

**Minuta** est une application web **offline-first** pour la transcription en temps réel de réunions et la génération automatique de comptes rendus via un LLM. L'application permet à l'utilisateur d'éditer/annoter la transcription avant la génération du compte rendu.

### Caractéristiques principales

- **Offline-first** : Tout fonctionne localement par défaut. La transcription utilise Whisper local et la génération de compte rendu utilise Ollama avec le modèle LLM local (Llama 3.2 3B). Support optionnel de services cloud (Groq recommandé, Vercel AI Gateway) pour des modèles plus performants (v2.2)
- **Temps réel** : Transcription partielle toutes les 3 secondes pendant l'enregistrement (v2.1)
- **Collage externe** : Possibilité de coller une transcription depuis une autre application (v2.1)
- **Multi-langues** : Support français et anglais
- **GPU automatique** : Détection et utilisation automatique du GPU si disponible (CUDA, MPS)
- **Thème adaptatif** : Support dark/light mode avec toggle manuel
- **Édition du compte rendu** : Possibilité d'éditer le compte rendu généré avant export (v2.0)


## 📦 Version 2.2 - 31 janvier 2026

### 🎉 Nouvelles fonctionnalités et améliorations

**Version 2.2** apporte le support des services cloud LLM et des améliorations significatives de l'expérience utilisateur.

#### ✨ Fonctionnalités ajoutées

1. **Support Groq et Vercel AI Gateway**
   - Service LLM unifié (`llm_service.py`) qui détecte automatiquement le provider via variables d'environnement
   - Support de l'API Groq avec modèles optimisés : openai/gpt-oss-20b, llama-3.3-70b-versatile, qwen/qwen3-32b
   - Support de Vercel AI Gateway avec modèles : openai/gpt-oss-20b, alibaba/qwen-3-30b, google/gemini-2.0-flash-lite, meta/llama-4-scout
   - Endpoint API `/api/models` pour récupérer dynamiquement les modèles disponibles selon le provider
   - Gestion d'erreurs améliorée avec messages explicites pour les problèmes d'API

2. **Configuration interactive améliorée**
   - Script `start.sh` avec configuration interactive des providers LLM
   - Détection et réutilisation automatique des clés API existantes
   - Nettoyage automatique des clés API (suppression des caractères indésirables)
   - Configuration automatique de tous les modèles prédéfinis (plus besoin de sélection manuelle)

3. **Indicateur de transcription amélioré**
   - Spinner visible pendant toute la durée de la transcription
   - État `isTranscribing` pour suivre la transcription même après l'arrêt de l'enregistrement
   - Indicateur visuel à côté du titre et message sous le textarea pendant le traitement

#### 🔧 Améliorations techniques

- Modèle par défaut changé de Mistral 7B à Llama 3.2 3B Instruct uniquement (plus léger, ~2GB au lieu de ~6.4GB)
- Service LLM unifié avec détection automatique du provider
- Healthcheck Docker augmenté à 3 minutes pour laisser le temps au modèle Whisper de se charger
- Gestion améliorée des variables d'environnement avec support des fichiers `.env`

#### 📝 Changements dans le code

**Backend** :
- `llm_service.py` (nouveau) : Service unifié pour Ollama, Groq et Vercel
- `summary.py` : Utilise `LLMService`, endpoint `/api/models` ajouté
- `docker-compose.yml` : Support des variables Groq/Vercel via `env_file`

**Frontend** :
- `SummaryGenerator.tsx` : Récupération dynamique des modèles via API
- `TranscriptionView.tsx` : Indicateur de transcription amélioré avec spinner
- `AudioRecorder.tsx` : Gestion de l'état `isTranscribing`
- `api.ts` : Fonction `getModels()` ajoutée
- `types/index.ts` : Type `ModelsResponse` ajouté

**Scripts** :
- `start.sh` : Configuration interactive des providers, gestion des clés API, nettoyage automatique

---

## 📦 Version 2.1 - 26 janvier 2026

### 🎉 Nouvelles fonctionnalités et améliorations

**Version 2.1** apporte des améliorations significatives de performance et d'expérience utilisateur.

#### ✨ Fonctionnalités ajoutées

1. **Collage de transcription externe**
   - Possibilité de coller une transcription depuis une autre application directement dans le champ de transcription
   - Le générateur de compte rendu s'affiche automatiquement dès qu'il y a du texte, même sans enregistrement
   - Modification de `TranscriptionView.tsx` pour permettre l'édition même sans enregistrement
   - Modification de `Meeting.tsx` pour afficher `SummaryGenerator` dès qu'il y a une transcription

2. **Transcriptions partielles en temps réel**
   - Affichage progressif de la transcription pendant l'enregistrement (toutes les 3 secondes)
   - Amélioration significative de l'expérience utilisateur
   - Backend : Implémentation avec `ThreadPoolExecutor` pour ne pas bloquer le WebSocket
   - Backend : Fonction `transcribe_partial()` asynchrone pour transcrire périodiquement
   - Frontend : Gestion améliorée des messages `partial` avec fusion intelligente

3. **Optimisations de performance**
   - **Préchargement du modèle Whisper** : Le modèle est chargé au démarrage de l'application pour éviter les délais lors de la première transcription
   - **Paramètres Whisper optimisés** : `best_of=1` (au lieu de 2) et `beam_size=3` (au lieu de 5) pour une transcription plus rapide
   - **Thread pool** : Utilisation de `ThreadPoolExecutor` pour les transcriptions afin de ne pas bloquer le WebSocket

#### 🐛 Corrections

1. **Correction de la duplication du dernier mot**
   - Nouvelle fonction `mergeTranscription()` dans `AudioRecorder.tsx`
   - Détection intelligente des chevauchements de texte en comparant les derniers mots de la transcription accumulée avec les premiers mots du nouveau texte
   - Évite les répétitions et les doublons dans les transcriptions partielles

#### 📝 Changements dans le code

**Frontend** :
- `TranscriptionView.tsx` : Permet l'édition même sans enregistrement, suppression de la variable `wasRecording` inutilisée
- `Meeting.tsx` : Affiche `SummaryGenerator` dès qu'il y a une transcription (même collée manuellement)
- `AudioRecorder.tsx` : 
  - Nouvelle fonction `mergeTranscription()` pour détecter et supprimer les chevauchements
  - Amélioration de la gestion des messages `partial` avec fusion intelligente

**Backend** :
- `main.py` : 
  - Implémentation des transcriptions partielles avec `asyncio` et `ThreadPoolExecutor`
  - Fonction `transcribe_partial()` pour transcrire périodiquement
  - Préchargement du modèle Whisper au démarrage
- `whisper_service.py` : 
  - Méthode `preload_model()` pour précharger le modèle
  - Optimisation des paramètres (`best_of=1`, `beam_size=3`)

---

## 📦 Version 2.0 - Janvier 2026

### 🎉 Nouvelles fonctionnalités et améliorations

**Version 2.0** apporte des améliorations significatives pour une meilleure expérience utilisateur et une installation simplifiée.

#### ✨ Fonctionnalités ajoutées

1. **Édition du compte rendu**
   - Interface d'édition intégrée avec `textarea` éditable
   - Indicateur visuel de modification (`isEdited` state)
   - Les exports PDF et TXT utilisent automatiquement le texte édité
   - Gestion d'état séparée : `summary` (original) et `editedSummary` (modifiable)

2. **Support de plusieurs providers LLM**
   - Ollama (par défaut) : Llama 3.2 3B Instruct
   - Groq (recommandé) : openai/gpt-oss-20b, llama-3.3-70b-versatile, qwen/qwen3-32b
   - Vercel AI Gateway : openai/gpt-oss-20b, alibaba/qwen-3-30b, google/gemini-2.0-flash-lite, meta/llama-4-scout
   - Sélection du modèle via dropdown dans l'interface
   - Téléchargement automatique des deux modèles au démarrage via `start.sh`
   - Validation côté backend des modèles disponibles

3. **Scripts d'installation et désinstallation améliorés**
   - **`start.sh`** :
     - Détection automatique du système d'exploitation (macOS, Linux, Windows)
     - Installation automatique de Docker (macOS, Ubuntu/Debian)
     - Installation automatique de Git Bash sur Windows si nécessaire
     - Téléchargement automatique du modèle LLM (Llama 3.2 3B) si Ollama est choisi
     - Configuration automatique des modèles si Groq ou Vercel est choisi
     - Messages d'aide spécifiques par plateforme
     - Vérification de santé des services Docker
   
   - **`uninstall.sh`** :
     - Désinstallation complète de l'application
     - Suppression des conteneurs, images, volumes et réseaux Docker
     - Option de suppression de l'image Ollama
     - Confirmation avant suppression
     - Détection automatique du système d'exploitation

#### 🔧 Améliorations techniques

- **Support multi-plateforme** :
  - Détection Windows via `OSTYPE` et `MSYSTEM`
  - Support Git Bash exclusif sur Windows (plus de WSL/PowerShell)
  - Messages d'erreur adaptés par plateforme

- **Configuration Nginx** :
  - Timeouts WebSocket augmentés (`proxy_read_timeout`, `proxy_send_timeout`)
  - Configuration optimisée pour les connexions longues

- **Gestion d'erreurs WebSocket** :
  - Timeout de 3 secondes avant affichage d'erreur
  - Vérification de l'état de connexion avant affichage
  - Gestion des fermetures normales vs erreurs

- **Variables CSS** :
  - Ajout de `--accent-color` et `--accent-rgb` pour cohérence visuelle
  - Styles pour textarea éditable avec focus states

#### 📝 Changements dans le code

**Frontend** :
- `SummaryGenerator.tsx` : Ajout de l'état `editedSummary` et `isEdited`
- `SummaryGenerator.tsx` : Remplacement de `div` par `textarea` éditable
- `SummaryActions.tsx` : Utilisation de `editedSummary` au lieu de `summary`
- `AudioRecorder.tsx` : Amélioration de la gestion d'erreurs WebSocket
- `Meeting.css` : Nouveaux styles pour textarea éditable et indicateur de modification
- `index.css` : Ajout des variables CSS d'accent

**Backend** :
- `routes/summary.py` : Validation des modèles LLM disponibles, endpoint `/api/models`
- `services/llm_service.py` : Service unifié pour Ollama, Groq et Vercel

**Infrastructure** :
- `docker/nginx.conf` : Configuration WebSocket améliorée
- `start.sh` : Logique d'installation multi-plateforme
- `uninstall.sh` : Script de désinstallation complet

---

---

## Architecture

### Architecture générale

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              React Frontend (Vite)                     │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │  │
│  │  │   Meeting    │  │   Prompts    │  │  Theme      │ │  │
│  │  │   Component  │  │   Component  │  │  Context    │ │  │
│  │  └──────────────┘  └──────────────┘  └────────────┘ │  │
│  │         │                  │                         │  │
│  │         │ WebSocket        │ REST API                 │  │
│  └─────────┼──────────────────┼─────────────────────────┘  │
└────────────┼──────────────────┼───────────────────────────┘
             │                  │
             ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVER (FastAPI)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              FastAPI Application                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │  │
│  │  │  WebSocket   │  │   REST API   │  │  Services  │ │  │
│  │  │   Handler    │  │   Routes     │  │            │ │  │
│  │  └──────────────┘  └──────────────┘  └────────────┘ │  │
│  │         │                  │              │          │  │
│  │         │                  │              │          │  │
│  │         ▼                  ▼              ▼          │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │  │
│  │  │   Whisper    │  │   Ollama     │  │  SQLite     │ │  │
│  │  │   Service    │  │   Service    │  │  Database   │ │  │
│  │  └──────────────┘  └──────────────┘  └────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Ollama (Docker)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Ollama Server                            │  │
│  │  ┌──────────────┐  ┌──────────────┐                   │  │
│  │  │    Llama     │                   │  │
│  │  │  3.2 3B Inst │                   │  │
│  │  └──────────────┘  └──────────────┘                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Architecture des composants Frontend

```
frontend/src/
├── components/
│   ├── Meeting/
│   │   ├── Meeting.tsx              # Composant principal
│   │   ├── AudioRecorder.tsx        # Gestion enregistrement + WebSocket
│   │   ├── TranscriptionView.tsx     # Affichage/édition transcription
│   │   ├── SummaryGenerator.tsx     # Génération compte rendu
│   │   ├── SummaryActions.tsx       # Actions (copier, exporter)
│   │   ├── LanguageSelector.tsx     # Sélection langue
│   │   └── RecordingStats.tsx       # Statistiques temps réel
│   └── Prompts/
│       ├── Prompts.tsx              # Composant principal
│       ├── PromptList.tsx           # Liste des prompts
│       └── PromptForm.tsx           # Formulaire CRUD
├── contexts/
│   └── ThemeContext.tsx             # Gestion thème dark/light
├── services/
│   ├── api.ts                        # Client REST API
│   └── websocket.ts                  # Client WebSocket (non utilisé)
└── types/
    └── index.ts                      # Types TypeScript
```

### Architecture des composants Backend

```
backend/app/
├── main.py                           # Point d'entrée FastAPI
├── db/
│   ├── database.py                   # Configuration SQLAlchemy
│   └── seed.py                       # Données initiales
├── models/
│   └── prompt.py                     # Modèle SQLAlchemy Prompt
├── routes/
│   ├── prompts.py                    # Routes REST pour prompts
│   └── summary.py                    # Route génération compte rendu
└── services/
    ├── whisper_service.py            # Service transcription Whisper
    └── ollama_service.py            # Service génération LLM Ollama
```

---

## Stack technique

### Frontend

| Technologie | Version | Usage |
|------------|---------|-------|
| React | 18.2.0 | Framework UI |
| TypeScript | 5.2.2 | Typage statique |
| Vite | 7.3.1 | Build tool et dev server |
| React Router | 6.20.0 | Routing |
| jsPDF | 4.0.0 | Export PDF |

### Backend

| Technologie | Version | Usage |
|------------|---------|-------|
| Python | 3.10+ | Langage principal |
| FastAPI | 0.104.1 | Framework web async |
| Uvicorn | 0.24.0 | ASGI server |
| SQLAlchemy | 2.0.23 | ORM |
| SQLite | - | Base de données |
| Whisper | 20231117 | Transcription audio |
| OpenAI | 1.0.0+ | Client API OpenAI-compatible (pour Ollama) |
| Poetry | - | Gestion dépendances |

### Infrastructure

| Technologie | Usage |
|------------|-------|
| Docker | Containerisation |
| Docker Compose | Orchestration |
| Nginx | Reverse proxy (production) |
| ffmpeg | Conversion audio |
| Ollama | Serveur LLM local avec téléchargement automatique des modèles |

---

## Structure du projet

```
minuta-scribe/
├── frontend/                         # Application React
│   ├── public/
│   │   └── logo.png                  # Logo de l'application
│   ├── src/
│   │   ├── components/               # Composants React
│   │   │   ├── Meeting/              # Composants page Meeting
│   │   │   └── Prompts/              # Composants page Prompts
│   │   ├── contexts/                 # Contextes React
│   │   ├── services/                 # Services API
│   │   ├── types/                    # Types TypeScript
│   │   ├── App.tsx                   # Composant racine
│   │   ├── App.css                   # Styles globaux
│   │   ├── main.tsx                  # Point d'entrée
│   │   └── index.css                 # Styles de base
│   ├── package.json                  # Dépendances npm
│   ├── tsconfig.json                  # Config TypeScript
│   └── vite.config.ts                # Config Vite
│
├── backend/                          # API FastAPI
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   # Point d'entrée FastAPI
│   │   ├── db/                       # Base de données
│   │   │   ├── database.py           # Config SQLAlchemy
│   │   │   └── seed.py               # Données initiales
│   │   ├── models/                   # Modèles SQLAlchemy
│   │   │   └── prompt.py
│   │   ├── routes/                   # Routes API
│   │   │   ├── prompts.py           # CRUD prompts
│   │   │   └── summary.py            # Génération compte rendu
│   │   └── services/                # Services métier
│   │       ├── whisper_service.py    # Transcription
│   │       └── ollama_service.py     # LLM
│   ├── pyproject.toml                # Config Poetry
│   ├── env.example                   # Exemple variables env
│   └── minuta.db                     # Base SQLite (généré)
│
├── docker/                           # Configuration Docker
│   ├── Dockerfile.backend            # Image backend
│   ├── Dockerfile.frontend           # Image frontend
│   ├── docker-compose.yml            # Orchestration
│   └── nginx.conf                    # Config Nginx
│
├── README.md                         # Documentation utilisateur
├── README_TECH.md                    # Documentation technique (ce fichier)
└── start.sh                          # Script démarrage rapide
```

---

## Flux de données

### Flux de transcription

```
┌─────────────┐
│   Browser   │
│  (User)     │
└──────┬──────┘
       │ 1. getUserMedia()
       ▼
┌─────────────────────┐
│  MediaRecorder API  │
│  (audio/webm;opus) │
└──────┬──────────────┘
       │ 2. Chunks (100ms)
       ▼
┌─────────────────────┐
│  WebSocket Client   │
│  (AudioRecorder.tsx)│
└──────┬──────────────┘
       │ 3. ws.send(chunk)
       ▼
┌─────────────────────┐
│  FastAPI WebSocket  │
│  (/ws/transcribe)    │
└──────┬──────────────┘
       │ 4. Accumulate chunks
       ▼
┌─────────────────────┐
│  WhisperService     │
│  - Convert webm→WAV │
│  - Transcribe       │
└──────┬──────────────┘
       │ 5. Text result
       ▼
┌─────────────────────┐
│  WebSocket Response  │
│  {type: "partial"}  │
│  {type: "final"}    │
└──────┬──────────────┘
       │ 6. Update UI
       ▼
┌─────────────────────┐
│  TranscriptionView  │
│  (Editable textarea)│
└─────────────────────┘
```

### Flux de génération de compte rendu

```
┌─────────────────────┐
│   User clicks       │
│   "Generate"        │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  SummaryGenerator   │
│  - Select prompt    │
│  - Select model     │
│  - Get transcription│
└──────┬──────────────┘
       │ 1. POST /api/generate-summary
       │    {prompt_id, transcription, model}
       ▼
┌─────────────────────┐
│  FastAPI Route      │
│  (/api/generate-...)│
└──────┬──────────────┘
       │ 2. Get prompt from DB
       ▼
┌─────────────────────┐
│  OllamaService      │
│  - Call Ollama API  │
│  - Model: mistral   │
│    or llama3.2      │
└──────┬──────────────┘
       │ 3. Return summary
       ▼
┌─────────────────────┐
│  Display Summary    │
│  + Export options   │
└─────────────────────┘
```

### Flux de gestion des prompts

```
┌─────────────────────┐
│   Prompts Page      │
└──────┬──────────────┘
       │
       ├── GET /api/prompts
       │   └─► List all prompts
       │
       ├── POST /api/prompts
       │   └─► Create prompt
       │
       ├── PUT /api/prompts/{id}
       │   └─► Update prompt
       │
       └── DELETE /api/prompts/{id}
           └─► Delete prompt
```

---

## Schémas

### Schéma de base de données

```sql
┌─────────────────────┐
│      prompts         │
├─────────────────────┤
│ id (PK) INTEGER     │
│ title VARCHAR       │
│ content TEXT        │
│ created_at DATETIME │
│ updated_at DATETIME │
└─────────────────────┘
```

**Modèle SQLAlchemy :**
```python
class Prompt(Base):
    __tablename__ = "prompts"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### Schéma de communication WebSocket

**Messages Client → Server :**
```json
// Initialisation (langue)
{"language": "fr"}

// Chunk audio (bytes)
<binary data>

// Arrêt enregistrement
{"type": "stop"}
```

**Messages Server → Client :**
```json
// Transcription partielle
{"type": "partial", "text": "Bonjour, comment allez-vous..."}

// Transcription finale
{"type": "final", "text": "Transcription complète..."}

// Erreur
{"type": "error", "message": "Erreur lors de la transcription"}
```

### Schéma d'API REST

**GET /api/prompts**
```json
Response: [
  {
    "id": 1,
    "title": "Compte rendu standard",
    "content": "Tu es un assistant...",
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  }
]
```

**POST /api/generate-summary**
```json
Request: {
  "prompt_id": 1,
  "transcription": "Transcription text...",
  "model": "mistral:7b-instruct"
}

Response: {
  "summary": "Compte rendu généré..."
}
```

**Modèles disponibles :**
- `llama3.2:3b` : Llama 3.2 3B Instruct (par défaut, 2.0 GB)
- `llama3.2:3b` : Llama 3.2 3B Instruct (2.0 GB)

---

## Installation et développement

### Prérequis

- **Python 3.10+** avec pip
- **Node.js 18+** et npm
- **ffmpeg** (conversion audio)
- **Docker** (optionnel, pour déploiement)

**Support multi-plateforme :**
- **macOS** : Terminal natif, Docker Desktop
- **Linux** : Terminal natif, Docker Engine ou Docker Desktop
- **Windows** : 
  - **Git Bash** (requis) : Inclus avec Git for Windows, permet d'exécuter les scripts bash. Si Git Bash n'est pas installé, le script `start.sh` vous proposera de l'installer automatiquement
  - **Docker Desktop pour Windows** : Requis pour exécuter les conteneurs Docker

### Installation locale

```bash
# Cloner le repository
git clone <repository-url>
cd minuta-scribe

# Backend
cd backend
python3 -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
pip install -r requirements.txt
cp env.example .env
# Pour développement local, configurer OLLAMA_BASE_URL=http://localhost:11434
# si Ollama tourne localement, sinon utiliser Docker Compose

# Frontend
cd ../frontend
npm install
```

### Développement

**Backend :**
```bash
cd backend
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

**Frontend :**
```bash
cd frontend
npm run dev
```

**Tests :**
```bash
# Backend
cd backend
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
pytest  # Si pytest est installé

# Frontend
cd frontend
npm run lint
```

### Scripts utiles

```bash
# Script de démarrage rapide (fonctionne sur Mac, Linux et Windows via Git Bash)
./start.sh

# Script de désinstallation (fonctionne sur Mac, Linux et Windows via Git Bash)
./uninstall.sh

# Formatage code (si black est installé)
cd backend
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
black app/  # Si black est installé: pip install black
cd ../frontend && npm run lint -- --fix
```

**Note Windows :** Les scripts `start.sh` et `uninstall.sh` sont des scripts bash et nécessitent Git Bash pour être exécutés sur Windows. Si Git Bash n'est pas installé, le script `start.sh` vous proposera de l'installer automatiquement. Les scripts ne fonctionnent pas directement dans PowerShell ou l'Invite de commandes Windows.

---

## Configuration

### Variables d'environnement

**Backend (.env) :**
```env
# Configuration Ollama (par défaut, utilisé si aucune clé API cloud n'est configurée)
# URL de Ollama (optionnel, valeur par défaut dans Docker: http://ollama:11434)
OLLAMA_BASE_URL=http://ollama:11434

# Configuration Groq (optionnel, pour utiliser Groq au lieu d'Ollama)
GROQ_API_KEY=votre_cle_api_groq
LLM_MODELS=openai/gpt-oss-20b,llama-3.3-70b-versatile,qwen/qwen3-32b

# Configuration Vercel AI Gateway (optionnel, pour utiliser Vercel au lieu d'Ollama)
# AI_GATEWAY_API_KEY=votre_cle_api_vercel
# LLM_MODELS=openai/gpt-oss-20b,alibaba/qwen-3-30b,google/gemini-2.0-flash-lite,meta/llama-4-scout
# OLLAMA_BASE_URL=http://ollama:11434
DATABASE_URL=sqlite:///./minuta.db
```

**Docker :**
Les variables d'environnement sont configurées automatiquement dans `docker-compose.yml`. 

**Configuration via `start.sh` (recommandé) :**
- Le script `start.sh` vous guide pour configurer Groq ou Vercel si vous le souhaitez
- Les clés API et modèles sont automatiquement enregistrés dans `backend/.env`
- Le fichier `.env` est exclu de Git pour protéger vos clés API

**Configuration manuelle :**
- Créez `backend/.env` avec les variables appropriées selon le provider choisi
- Pour Groq : `GROQ_API_KEY=...` et `LLM_MODELS=...`
- Pour Vercel : `AI_GATEWAY_API_KEY=...` et `LLM_MODELS=...`
- Si aucune clé API n'est configurée, Ollama sera utilisé par défaut

### Configuration Whisper

Modèle par défaut : `small` (bon compromis vitesse/qualité)

Options disponibles dans `backend/app/services/whisper_service.py` :
- `tiny` : Plus rapide, moins précis
- `base` : Rapide, précision moyenne
- `small` : **Défaut** - Bon compromis
- `medium` : Plus lent, plus précis
- `large` : Très lent, très précis

### Configuration Ollama

Modèles disponibles :
- `llama3.2:3b` : Llama 3.2 3B Instruct (par défaut, 2.0 GB)
- `llama3.2:3b` : Llama 3.2 3B Instruct (2.0 GB)

Le modèle Llama 3.2 3B est automatiquement téléchargé au démarrage via le script `start.sh` si Ollama est choisi. Si le modèle n'est pas disponible, il sera téléchargé au premier usage. Pour télécharger manuellement, on peut exécuter `docker exec minuta-ollama ollama pull llama3.2:3b`.

**Note :** Si vous utilisez Groq ou Vercel, aucun téléchargement de modèle local n'est nécessaire.

Configuration modifiable dans `backend/app/services/ollama_service.py`

---

## API Documentation

### Endpoints REST

#### Prompts

- `GET /api/prompts` - Liste tous les prompts
- `GET /api/prompts/{id}` - Récupère un prompt
- `POST /api/prompts` - Crée un prompt
- `PUT /api/prompts/{id}` - Met à jour un prompt
- `DELETE /api/prompts/{id}` - Supprime un prompt

#### Summary

- `POST /api/summary/generate` - Génère un compte rendu

### WebSocket

- `WS /ws/transcribe` - Transcription en temps réel

**Documentation interactive :** http://localhost:8000/docs (Swagger UI)

---

## Tests

### Structure des tests

```
backend/
└── tests/
    ├── test_prompts.py
    ├── test_summary.py
    └── test_whisper_service.py
```

### Exécution

```bash
cd backend
poetry run pytest
poetry run pytest --cov=app tests/
```

---

## Déploiement

### Docker

**Build et lancement :**
```bash
cd docker
docker-compose up --build
```

> **Note :** Aucune configuration manuelle requise ! Le modèle LLM (Llama 3.2 3B) est automatiquement téléchargé au démarrage via le script `start.sh` si Ollama est choisi. Le premier téléchargement peut prendre quelques minutes (~2.0GB). Avec Groq ou Vercel, aucun téléchargement n'est nécessaire.

**Production :**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Variables d'environnement production

- `OLLAMA_BASE_URL` : Optionnel (défaut: `http://ollama:11434`)
- `DATABASE_URL` : Optionnel (SQLite par défaut)
- `CORS_ORIGINS` : Origines autorisées

**Prérequis système :**
- RAM : Au moins 8GB recommandés (16GB pour de meilleures performances)
- Espace disque : ~10-15GB pour les modèles LLM et les images Docker
- **Windows** : Git Bash (inclus avec Git for Windows) pour exécuter les scripts bash. Si Git Bash n'est pas installé, le script `start.sh` vous proposera de l'installer automatiquement

---

## Contributions

### Guidelines

1. **Branches** : `feature/`, `fix/`, `docs/`
2. **Commits** : Messages clairs et descriptifs
3. **Code style** :
   - Python : Black (line-length: 100)
   - TypeScript : ESLint configuré
4. **Tests** : Ajouter des tests pour nouvelles fonctionnalités

### Workflow

1. Fork le repository
2. Créer une branche
3. Faire les modifications
4. Ajouter des tests
5. Soumettre une Pull Request

---

## Limitations et améliorations futures

### Limitations actuelles

1. **Audio système** : Seul le micro est supporté (pas getDisplayMedia)
2. **Navigateurs** : Chrome/Edge recommandés
3. **Performance** : Transcription peut être lente selon CPU
4. **Stockage** : Pas de persistance des transcriptions/comptes rendus (volontaire)
5. **Taille Docker** : 
   - Image backend ~2-3GB (Whisper)
   - Image Ollama ~2GB (base, modèles téléchargés séparément)
   - Modèles LLM (Ollama) : ~2.0GB (Llama 3.2 3B, téléchargé automatiquement au démarrage)
   - Avec Groq ou Vercel : Aucun téléchargement de modèle local nécessaire
   - Total initial : ~4-5GB, puis ~10-15GB après téléchargement des modèles

### Améliorations prévues

- [ ] Support audio système (getDisplayMedia)
- [ ] Historique des réunions
- [ ] Export Word/HTML
- [ ] Multi-langues (plus que FR/EN)
- [ ] Optimisation GPU (déjà implémenté, à améliorer)
- [ ] Tests unitaires et d'intégration complets
- [ ] CI/CD pipeline

---

## Ressources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Whisper Documentation](https://github.com/openai/whisper)
- [Ollama Documentation](https://ollama.ai/)
- [Ollama API Documentation](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [React Documentation](https://react.dev/)

---

## Licence

[À définir]

---

**Dernière mise à jour :** 26 janvier 2026 (Version 2.1)
