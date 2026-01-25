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

- **Offline-first** : La transcription se fait localement via Whisper, seule la génération de compte rendu nécessite une connexion cloud
- **Temps réel** : Transcription partielle toutes les 15 secondes pendant l'enregistrement
- **Multi-langues** : Support français et anglais
- **GPU automatique** : Détection et utilisation automatique du GPU si disponible (CUDA, MPS)
- **Thème adaptatif** : Support dark/light mode avec toggle manuel

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
│  │  │   Whisper    │  │   Groq API   │  │  SQLite     │ │  │
│  │  │   Service    │  │   Service    │  │  Database   │ │  │
│  │  └──────────────┘  └──────────────┘  └────────────┘ │  │
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
    └── groq_service.py               # Service génération LLM Groq
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
| Groq | 0.4.0 | Client API LLM |
| Poetry | - | Gestion dépendances |

### Infrastructure

| Technologie | Usage |
|------------|-------|
| Docker | Containerisation |
| Docker Compose | Orchestration |
| Nginx | Reverse proxy (production) |
| ffmpeg | Conversion audio |

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
│   │       └── groq_service.py       # LLM
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
│  - Get transcription│
└──────┬──────────────┘
       │ 1. POST /api/summary/generate
       ▼
┌─────────────────────┐
│  FastAPI Route      │
│  (/api/summary/...) │
└──────┬──────────────┘
       │ 2. Get prompt from DB
       ▼
┌─────────────────────┐
│  GroqService        │
│  - Call Groq API    │
│  - Model: llama-3.1 │
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

**POST /api/summary/generate**
```json
Request: {
  "prompt_id": 1,
  "transcription": "Transcription text..."
}

Response: {
  "summary": "Compte rendu généré..."
}
```

---

## Installation et développement

### Prérequis

- **Python 3.10+** avec Poetry
- **Node.js 18+** et npm
- **ffmpeg** (conversion audio)
- **Docker** (optionnel, pour déploiement)

### Installation locale

```bash
# Cloner le repository
git clone <repository-url>
cd minuta-scribe

# Backend
cd backend
poetry install
cp env.example .env
# Éditer .env avec votre GROQ_API_KEY

# Frontend
cd ../frontend
npm install
```

### Développement

**Backend :**
```bash
cd backend
poetry run uvicorn app.main:app --reload --port 8000
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
poetry run pytest

# Frontend
cd frontend
npm run lint
```

### Scripts utiles

```bash
# Script de démarrage rapide
./start.sh

# Formatage code
cd backend && poetry run black app/
cd frontend && npm run lint -- --fix
```

---

## Configuration

### Variables d'environnement

**Backend (.env) :**
```env
GROQ_API_KEY=your-groq-api-key-here
DATABASE_URL=sqlite:///./minuta.db
```

**Docker (docker/.env) :**
```env
GROQ_API_KEY=your-groq-api-key-here
```

### Configuration Whisper

Modèle par défaut : `small` (bon compromis vitesse/qualité)

Options disponibles dans `backend/app/services/whisper_service.py` :
- `tiny` : Plus rapide, moins précis
- `base` : Rapide, précision moyenne
- `small` : **Défaut** - Bon compromis
- `medium` : Plus lent, plus précis
- `large` : Très lent, très précis

### Configuration Groq

Modèle utilisé : `llama-3.1-8b-instant`

Modifiable dans `backend/app/services/groq_service.py`

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

**Production :**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Variables d'environnement production

- `GROQ_API_KEY` : Requis
- `DATABASE_URL` : Optionnel (SQLite par défaut)
- `CORS_ORIGINS` : Origines autorisées

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
5. **Taille Docker** : Image backend ~2-3GB (Whisper)

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
- [Groq API Documentation](https://console.groq.com/docs)
- [React Documentation](https://react.dev/)

---

## Licence

[À définir]

---

**Dernière mise à jour :** 2024
