"""
blueprints/auth.py — Routes d'authentification.
/api/auth/register  POST  → Inscription
/api/auth/login     POST  → Connexion
/api/auth/logout    POST  → Déconnexion
/api/auth/me        GET   → Profil de l'utilisateur connecté
"""
from flask import Blueprint, request, jsonify
from backend.extensions import db
from backend.models.user import User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    # TODO: Implémenter la logique d'inscription
    return jsonify({"message": "Route register — à implémenter"}), 501


@auth_bp.route("/login", methods=["POST"])
def login():
    # TODO: Implémenter la logique de connexion
    return jsonify({"message": "Route login — à implémenter"}), 501


@auth_bp.route("/logout", methods=["POST"])
def logout():
    # TODO: Implémenter la déconnexion
    return jsonify({"message": "Route logout — à implémenter"}), 501


@auth_bp.route("/me", methods=["GET"])
def me():
    # TODO: Retourner le profil de l'utilisateur connecté
    return jsonify({"message": "Route me — à implémenter"}), 501
