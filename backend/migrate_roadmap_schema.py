from extensions import db
from app import create_app
from sqlalchemy import text

app = create_app()

with app.app_context():
    statements = [
        "ALTER TABLE roadmaps ADD COLUMN daily_study_hours FLOAT DEFAULT 1.0;",
        "ALTER TABLE roadmaps ADD COLUMN study_days_per_week INT DEFAULT 5;",
        "ALTER TABLE roadmaps ADD COLUMN learning_style VARCHAR(50) DEFAULT 'balanced';",
        "ALTER TABLE roadmaps ADD COLUMN total_learning_hours FLOAT DEFAULT 40.0;",
        "ALTER TABLE roadmap_items ADD COLUMN tasks JSON;",
        "ALTER TABLE roadmap_items ADD COLUMN expected_outcome TEXT;"
    ]
    
    for stmt in statements:
        try:
            db.session.execute(text(stmt))
            db.session.commit()
            print(f"Executed: {stmt}")
        except Exception as e:
            db.session.rollback()
            print(f"Skipped / Already exists: {stmt} -> {e}")

    print("Migration finished successfully.")

