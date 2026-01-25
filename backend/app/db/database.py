from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from pathlib import Path

# Chemin vers la base de données SQLite
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Récupérer l'URL de la base de données depuis les variables d'environnement
DATABASE_URL_ENV = os.getenv("DATABASE_URL")

if DATABASE_URL_ENV:
    # Si DATABASE_URL est fournie, l'utiliser directement
    DATABASE_URL = DATABASE_URL_ENV
    # Si c'est un chemin relatif (commence par sqlite:///./), créer le répertoire si nécessaire
    if DATABASE_URL.startswith("sqlite:///./"):
        # Extraire le chemin du fichier
        db_path = DATABASE_URL.replace("sqlite:///./", "")
        db_dir = Path(db_path).parent
        # Créer le répertoire s'il n'existe pas
        if db_dir and not db_dir.exists():
            db_dir.mkdir(parents=True, exist_ok=True)
            print(f"Répertoire de base de données créé: {db_dir}")
else:
    # Par défaut, utiliser le répertoire backend
    DATABASE_URL = f"sqlite:///{BASE_DIR}/minuta.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency pour obtenir une session DB"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialise la base de données (crée les tables)"""
    print(f"Initialisation de la base de données: {DATABASE_URL}")
    Base.metadata.create_all(bind=engine)
    print("Base de données initialisée avec succès.")
