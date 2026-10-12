from extensions import db
from models.user import User
from models.resume import Resume
from models.job_description import JobDescription

db_session = db.session
Base = db.Model

def init_db(app=None):
    """Initializes tables in the MySQL database."""
    if app:
        with app.app_context():
            db.create_all()
    else:
        db.create_all()

def get_db():
    """Yields a database session context."""
    try:
        yield db.session
    finally:
        pass

__all__ = [
    'db',
    'db_session',
    'Base',
    'init_db',
    'get_db'
]
