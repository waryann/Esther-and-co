"""
models/user.py — Table des utilisateurs / clients EST'HAIR & CO.
"""
from datetime import datetime
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from backend.extensions import db


class User(UserMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    first_name = db.Column(db.String(80), nullable=False)
    last_name = db.Column(db.String(80), nullable=False)
    phone = db.Column(db.String(20), nullable=True)

    # Mensurations pour la pose (tour de tête, etc.)
    head_size = db.Column(db.String(50), nullable=True)
    notes = db.Column(db.Text, nullable=True)

    # Rôle : 'client' ou 'admin'
    role = db.Column(db.String(20), nullable=False, default="client")

    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # --- Relations ---
    orders = db.relationship("Order", backref="client", lazy=True)
    appointments = db.relationship("Appointment", backref="client", lazy=True)

    # --- Méthodes utilitaires ---
    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def is_admin(self):
        return self.role == "admin"

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "phone": self.phone,
            "head_size": self.head_size,
            "role": self.role,
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self):
        return f"<User {self.email}>"
