"""
extensions.py — Instanciation centralisée des extensions Flask.
On initialise ici sans lier à une app pour éviter les imports circulaires.
L'app est liée dans create_app() via .init_app(app).
"""
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_cors import CORS

# Instance unique de la base de données
db = SQLAlchemy()

# Gestionnaire d'authentification
login_manager = LoginManager()
login_manager.login_view = "auth.login"
login_manager.login_message = "Veuillez vous connecter pour accéder à cette page."

# CORS pour autoriser les requêtes depuis React
cors = CORS()
