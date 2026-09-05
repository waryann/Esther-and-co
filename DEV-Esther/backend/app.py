"""
app.py — Point d'entrée principal du serveur Flask EST'HAIR & CO.

Architecture :
  - Factory pattern avec create_app() pour faciliter les tests.
  - Extensions initialisées via extensions.py (pas d'imports circulaires).
  - Routes organisées en Blueprints séparés par domaine fonctionnel.
  - Base de données SQLite via Flask-SQLAlchemy.
  - CORS activé pour permettre au front React (Vite port 5173) de communiquer.
"""
import os
from flask import Flask, jsonify
from backend.config import config_by_name
from backend.extensions import db, login_manager, cors


def create_app(config_name: str = "default") -> Flask:
    """
    Factory function pour créer et configurer l'application Flask.

    Args:
        config_name: Nom de la configuration à charger ('development', 'production').

    Returns:
        L'instance Flask configurée et prête à démarrer.
    """
    dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'dist'))
    app = Flask(__name__, static_folder=dist_dir, static_url_path='/')

    # --- Chargement de la configuration ---
    app.config.from_object(config_by_name[config_name])

    # --- Initialisation des extensions ---
    db.init_app(app)
    login_manager.init_app(app)
    cors.init_app(app, resources={
        r"/api/*": {"origins": app.config["CORS_ORIGINS"]}
    })

    # --- Chargement de l'utilisateur pour Flask-Login ---
    from backend.models.user import User

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # --- Enregistrement des Blueprints (routes API) ---
    from backend.blueprints.auth import auth_bp
    from backend.blueprints.products import products_bp
    from backend.blueprints.orders import orders_bp
    from backend.blueprints.appointments import appointments_bp
    from backend.blueprints.payments import payments_bp
    from backend.blueprints.admin import admin_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(appointments_bp)
    app.register_blueprint(payments_bp)
    app.register_blueprint(admin_bp)

    # --- Création des tables SQLite au premier démarrage ---
    with app.app_context():
        # Import des modèles pour que SQLAlchemy les découvre
        from backend.models import User, Product, ProductVariant, Service, Appointment, Order, OrderItem
        db.create_all()
        print("✅ Base de données SQLite initialisée.")

    # --- Route de santé (health check) ---
    @app.route("/api/health")
    def health():
        return jsonify({
            "status": "ok",
            "service": "EST'HAIR & CO. API",
            "version": "1.0.0",
        }), 200

    # --- Route pour servir le frontend React ---
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return app.send_static_file(path)
        else:
            return app.send_static_file("index.html")

    # --- Gestionnaire d'erreurs global ---
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Ressource introuvable."}), 404

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({"error": "Accès non autorisé."}), 403

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Erreur interne du serveur."}), 500

    return app


# --- Point d'entrée direct ---
if __name__ == "__main__":
    env = os.environ.get("FLASK_ENV", "development")
    application = create_app(env)
    application.run(
        host="0.0.0.0",
        port=5003,
        debug=(env == "development")
    )
