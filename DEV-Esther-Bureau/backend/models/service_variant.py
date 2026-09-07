"""
models/service_variant.py — Déclinaisons d'un pack (longueur, style) avec leur propre prix.
Ex: Pack Flipover 2 paquets 16" = 200€, Pack Flipover 3 paquets 22" = 420€.
"""
from backend.extensions import db


class ServiceVariant(db.Model):
    __tablename__ = "service_variants"

    id = db.Column(db.Integer, primary_key=True)
    service_id = db.Column(db.Integer, db.ForeignKey("services.id"), nullable=False)

    # Libellé affiché au client, ex: "2 paquets de 16 pouces"
    label = db.Column(db.String(200), nullable=False)

    # Attributs de déclinaison (optionnels selon le pack)
    length = db.Column(db.String(20), nullable=True)   # Ex: '16"', '22"'
    style = db.Column(db.String(120), nullable=True)    # Ex: type de balayage pour le Pack Balayage

    # Prix total de la prestation pour cette déclinaison (pas un modificateur : le prix est fixe par pack)
    price = db.Column(db.Float, nullable=False)

    sort_order = db.Column(db.Integer, nullable=False, default=0)
    is_active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            "id": self.id,
            "service_id": self.service_id,
            "label": self.label,
            "length": self.length,
            "style": self.style,
            "price": self.price,
        }

    def __repr__(self):
        return f"<ServiceVariant {self.label} — {self.price}€>"
