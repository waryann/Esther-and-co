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

    # Ce qui est inclus dans la prestation, une ligne par élément
    # Ex: "Brushing\nNattes\nPose du tissage"
    includes = db.Column(db.Text, nullable=True)

    # Conditions / informations importantes affichées au client
    conditions = db.Column(db.Text, nullable=True)

    # Un "pack" a plusieurs longueurs/tailles au choix (voir ServiceVariant),
    # une prestation simple a un prix fixe unique.
    is_pack = db.Column(db.Boolean, default=False)

    # --- Relations ---
    appointments = db.relationship("Appointment", backref="service", lazy=True)
    variants = db.relationship("ServiceVariant", backref="service", lazy=True, cascade="all, delete-orphan", order_by="ServiceVariant.sort_order")
    options = db.relationship("ServiceOption", backref="service", lazy=True, cascade="all, delete-orphan")

    def get_deposit_amount(self, base_price=None):
        """Calcule le montant réel de l'acompte, sur le prix donné (ou le prix de base)."""
        price = base_price if base_price is not None else self.price
        if self.deposit_is_percent:
            return round(price * self.deposit_amount / 100, 2)
        return self.deposit_amount

    def to_dict(self, include_details=False):
        data = {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "duration_minutes": self.duration_minutes,
            "price": self.price,
            "deposit_amount": self.get_deposit_amount(),
            "deposit_is_percent": self.deposit_is_percent,
            "deposit_value": self.deposit_amount,
            "requires_wig_deposit": self.requires_wig_deposit,
            "is_pack": self.is_pack,
        }
        if include_details:
            data["includes"] = [line for line in (self.includes or "").split("\n") if line.strip()]
            data["conditions"] = self.conditions
            data["variants"] = [v.to_dict() for v in self.variants if v.is_active]
            data["options"] = [o.to_dict() for o in self.options if o.is_active]
        return data

    def __repr__(self):
        return f"<Service {self.name}>"
