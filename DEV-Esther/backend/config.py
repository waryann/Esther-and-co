import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    # --- Sécurité ---
    SECRET_KEY = os.environ.get("SECRET_KEY", "esthair-dev-secret-key-change-in-prod")

    # --- Base de données SQLite ---
    # BASE_DIR = backend/, donc instance/ est bien dans backend/instance/
    INSTANCE_DIR = os.path.join(BASE_DIR, "instance")
    os.makedirs(INSTANCE_DIR, exist_ok=True)  # Crée le dossier si absent
    database_url = os.environ.get(
        "DATABASE_URL",
        f"sqlite:///{os.path.join(INSTANCE_DIR, 'esthair.db')}"
    )
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    
    SQLALCHEMY_DATABASE_URI = database_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # --- CORS (autorise le front React sur port 5173, Flask sur 5003) ---
    CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # --- Acompte par défaut (%) ---
    DEFAULT_DEPOSIT_PERCENT = 30

    # --- Upload photos produits ---
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "static", "uploads")
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}


    # --- Configuration Twilio (SMS) ---
    TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")
    TWILIO_PHONE_NUMBER = os.environ.get("TWILIO_PHONE_NUMBER")

    # --- Configuration Cloudinary (Upload images) ---
    CLOUDINARY_CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY = os.environ.get("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET = os.environ.get("CLOUDINARY_API_SECRET")

    # --- Configuration Stripe (Paiements) ---
    STRIPE_PUBLIC_KEY = os.environ.get("STRIPE_PUBLIC_KEY")
    STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY")

    # --- Configuration Emails (Resend) ---
    RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
    COMPANY_EMAIL = os.environ.get("COMPANY_EMAIL", "onboarding@resend.dev") # Par défaut l'email de test Resend

class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
