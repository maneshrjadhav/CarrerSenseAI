"""
Migration Script for Targeted Resumes Table in MySQL
Creates targeted_resumes table without touching existing tables or user data.
CareerSense AI - Final Year Engineering Project
"""

import sys
import os

backend_path = os.path.dirname(os.path.abspath(__file__))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from app import create_app
from extensions import db
from models.targeted_resume import TargetedResume

def migrate():
    app = create_app()
    with app.app_context():
        print("[Migration] Verifying / Creating targeted_resumes table in MySQL...")
        db.create_all()
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()
        if 'targeted_resumes' in tables:
            print("[Migration] Success: targeted_resumes table is verified and active.")
            cols = [c['name'] for c in inspector.get_columns('targeted_resumes')]
            print(f"[Migration] Columns: {', '.join(cols)}")
        else:
            print("[Migration] Error: targeted_resumes table could not be found.")

if __name__ == '__main__':
    migrate()

