import os
import sys
import pymysql
from dotenv import load_dotenv

# Ensure backend root is on Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import Config
from extensions import db
from models import User, Resume, JobDescription
from flask import Flask

def ensure_database_exists():
    """Connect to MySQL without database selected to ensure target database exists."""
    print("Checking MySQL server connection...")
    try:
        connection = pymysql.connect(
            host=Config.MYSQL_HOST,
            port=int(Config.MYSQL_PORT),
            user=Config.MYSQL_USER,
            password=Config.MYSQL_PASSWORD,
            autocommit=True
        )
        with connection.cursor() as cursor:
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{Config.MYSQL_DATABASE}` "
                f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
            )
            print(f"Database '{Config.MYSQL_DATABASE}' confirmed/created.")
        connection.close()
        return True
    except Exception as e:
        print(f"Error ensuring database exists: {e}")
        return False

def init_tables():
    """Initializes SQLAlchemy tables inside careersense_ai."""
    if not ensure_database_exists():
        print("Aborting table initialization due to connection error.")
        return False

    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)

    with app.app_context():
        try:
            print("Creating database tables using SQLAlchemy models...")
            db.create_all()
            print("Tables created successfully.")

            # Inspect created tables
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            print(f"Current tables in '{Config.MYSQL_DATABASE}': {tables}")
            expected = ['users', 'resumes', 'job_descriptions']
            all_present = all(t in tables for t in expected)
            if all_present:
                print("All required tables (users, resumes, job_descriptions) verified.")
                return True
            else:
                missing = [t for t in expected if t not in tables]
                print(f"Missing expected tables: {missing}")
                return False
        except Exception as e:
            print(f"Error initializing tables: {e}")
            return False

if __name__ == '__main__':
    print("========================================")
    print("CareerSense AI — Database Initialization")
    print("========================================")
    success = init_tables()
    if success:
        print("Database initialization completed successfully.")
        sys.exit(0)
    else:
        print("Database initialization failed.")
        sys.exit(1)

