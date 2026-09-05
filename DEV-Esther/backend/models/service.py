"""
models/service.py — Prestations proposées (types de pose de perruque).
Chaque service a une durée variable et un acompte obligatoire.
"""
from backend.extensions import db


class Service(db.Model):
    __tablename__ = "services"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)

    # Durée en minutes (variable selon la prestation)
    # Ex: Pose lace front = 120 min, Pose full lace = 180 min
    duration_minutes = db.Column(db.Integer, nullable=False, default=60)

    price = db.Column(db.Float, nullable=False)

    # Montant de l'acompte obligatoire (fixe ou calculé en %)
    deposit_amount = db.Column(db.Float, nullable=False, default=0.0)
    deposit_is_percent = db.Column(db.Boolean, default=False)

    # Si True, le client doit déposer sa perruque avant le RDV
    requires_wig_deposit = db.Column(db.Boolean, default=False)

    is_active = db.Column(db.Boolean, default=True)

    # --- Relations ---
    appointments = db.relationship("Appointment", backref="service", lazy=True)

    def get_deposit_amount(self):
        """Calcule le montant réel de l'acompte."""
        if self.deposit_is_percent:
            return round(self.price * self.deposit_amount / 100, 2)
        return self.deposit_amount

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "duration_minutes": self.duration_minutes,
            "price": self.price,
            "deposit_amount": self.get_deposit_amount(),
            "requires_wig_deposit": self.requires_wig_deposit,
        }

    def __repr__(self):
        return f"<Service {self.name}>"
