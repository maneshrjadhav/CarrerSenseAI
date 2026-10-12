import os
from flask import Flask, jsonify
from flask_cors import CORS
from sqlalchemy import text
from dotenv import load_dotenv

from config import Config
from extensions import db, jwt
from models import (
    User, Resume, JobDescription, Analysis,
    AnalysisSkill, SkillGap, Roadmap, RoadmapItem, Report,
    ResumeSection, ResumeSkill, ResumeAnalysis, ResumeSuggestion,
    InterviewSession, InterviewQuestion
)
from routes.auth import auth_bp
from routes.dashboard import dashboard_bp
from routes.resume import resume_bp
from routes.analysis import analysis_bp
from routes.roadmap import roadmap_bp
from routes.reports import reports_bp
from routes.job_match import job_match_bp, skill_gap_bp, career_roadmap_bp
from routes.chat import chat_bp
from routes.interview import interview_bp
from routes.subscription import subscription_bp
from routes.admin import admin_bp

load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Configure CORS specifically for CareerSense AI frontend on dedicated port 5275
    CORS(app, resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5275",
                "http://127.0.0.1:5275"
            ],
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # Ensure uploads folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'resumes'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'reports'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'receipts'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'qr_codes'), exist_ok=True)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(resume_bp, url_prefix='/api/resume')
    app.register_blueprint(analysis_bp, url_prefix='/api/analysis')
    app.register_blueprint(job_match_bp, url_prefix='/api/job-match')
    app.register_blueprint(skill_gap_bp, url_prefix='/api/skill-gap')
    app.register_blueprint(career_roadmap_bp, url_prefix='/api/career-roadmap')
    app.register_blueprint(roadmap_bp, url_prefix='/api/roadmap')
    app.register_blueprint(reports_bp, url_prefix='/api/report')
    app.register_blueprint(reports_bp, url_prefix='/api/reports', name='reports_alias')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(interview_bp, url_prefix='/api/interview')
    app.register_blueprint(subscription_bp, url_prefix='/api/subscription')
    app.register_blueprint(subscription_bp, url_prefix='/api/subscriptions', name='subscription_alias')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    # Automatic database verification & table initialization
    with app.app_context():
        try:
            db.create_all()
            print("[Database] MySQL connection and tables verified successfully.")
        except Exception as e:
            print(f"[Database Error] Could not initialize MySQL tables: {e}")

    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        try:
            db.session.execute(text("SELECT 1"))
            return jsonify({
                "status": "healthy",
                "database": "connected"
            }), 200
        except Exception as err:
            return jsonify({
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(err)
            }), 503

    # Database test endpoint
    @app.route('/api/db-test', methods=['GET'])
    def db_test():
        try:
            result = db.session.execute(text("SELECT 1")).scalar()
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            return jsonify({
                "success": True,
                "message": "MySQL connection successful",
                "database": Config.MYSQL_DATABASE,
                "tables": tables
            }), 200
        except Exception as err:
            return jsonify({
                "success": False,
                "message": f"MySQL connection failed: {str(err)}"
            }), 500

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
