"""
models/service_option.py — Options payantes rattachées à une prestation (ex: coloration).
La cliente peut sélectionner l'option et joindre une photo d'inspiration.
"""
from backend.extensions import db


class ServiceOption(db.Model):
    __tablename__ = "service_options"

    id = db.Column(db.Integer, primary_key=True)
    service_id = db.Column(db.Integer, db.ForeignKey("services.id"), nullable=False)

    name = db.Column(db.String(200), nullable=False)   # Ex: "Coloration uniforme", "Balayage ou autre coloration"
    price = db.Column(db.Float, nullable=False)

    # Si True, le formulaire propose d'ajouter une photo de la couleur/du résultat souhaité
    allows_photo = db.Column(db.Boolean, default=False)

    is_active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            "id": self.id,
            "service_id": self.service_id,
            "name": self.name,
            "price": self.price,
            "allows_photo": self.allows_photo,
        }

    def __repr__(self):
        return f"<ServiceOption {self.name} — {self.price}€>"
