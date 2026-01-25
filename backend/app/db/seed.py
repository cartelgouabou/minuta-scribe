from app.db.database import SessionLocal, init_db
from app.models.prompt import Prompt


def seed_prompts():
    """Crée 3 prompts par défaut si la table est vide"""
    init_db()
    db = SessionLocal()

    try:
        # Vérifier si des prompts existent déjà
        existing_count = db.query(Prompt).count()
        if existing_count > 0:
            print(f"La base de données contient déjà {existing_count} prompt(s). Pas de seed nécessaire.")
            return

        # Créer 3 prompts par défaut
        default_prompts = [
            {
                "title": "Compte rendu standard",
                "content": "Génère un compte rendu structuré de la réunion avec les points suivants :\n1. Ordre du jour\n2. Points discutés\n3. Décisions prises\n4. Actions à suivre\n5. Prochaines étapes",
            },
            {
                "title": "Compte rendu détaillé",
                "content": "Génère un compte rendu détaillé et exhaustif de la réunion incluant :\n- Contexte et objectifs\n- Participants et leurs contributions\n- Discussions détaillées\n- Décisions prises avec justifications\n- Actions assignées avec responsables et échéances\n- Points bloquants identifiés\n- Prochaines étapes et planning",
            },
            {
                "title": "Compte rendu synthétique",
                "content": "Génère un compte rendu synthétique et concis de la réunion avec uniquement :\n- Points clés discutés\n- Décisions principales\n- Actions essentielles",
            },
        ]

        for prompt_data in default_prompts:
            prompt = Prompt(**prompt_data)
            db.add(prompt)

        db.commit()
        print("3 prompts par défaut ont été créés avec succès.")
    except Exception as e:
        print(f"Erreur lors du seed : {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_prompts()
