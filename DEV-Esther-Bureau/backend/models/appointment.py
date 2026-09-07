"""
models/appointment.py — Rendez-vous pour les prestations de pose.
Gère les créneaux, les acomptes et le suivi client.
"""
from datetime import datetime
from backend.extensions import db


class Appointment(db.Model):
    __tablename__ = "appointments"

    id = db.Column(db.Integer, primary_key=True)

    # Relations
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    service_id = db.Column(db.Integer, db.ForeignKey("services.id"), nullable=False)

    # Déclinaison choisie pour les packs (longueur/style) — null pour une prestation à prix fixe
    variant_id = db.Column(db.Integer, db.ForeignKey("service_variants.id"), nullable=True)

    # Créneau réservé
    scheduled_at = db.Column(db.DateTime, nullable=False)

    # Statut du RDV
    # 'pending'   → En attente de confirmation + acompte
    # 'confirmed' → Acompte payé, RDV validé
    # 'completed' → Prestation effectuée
    # 'cancelled' → Annulé
    status = db.Column(db.String(20), nullable=False, default="pending")

    # Acompte obligatoire
    deposit_paid = db.Column(db.Boolean, default=False)
    deposit_paid_at = db.Column(db.DateTime, nullable=True)

    # Prix total figé au moment de la réservation (prestation/pack + options),
    # pour ne pas dépendre d'un changement de tarif ultérieur.
    total_price = db.Column(db.Float, nullable=True)
    deposit_amount = db.Column(db.Float, nullable=True)

    # --- Relations ---
    variant = db.relationship("ServiceVariant")
    selected_options = db.relationship("AppointmentOption", backref="appointment", lazy=True, cascade="all, delete-orphan")

    # Suivi client spécifique
    wig_deposit_received = db.Column(db.Boolean, default=False)   # Perruque déposée ?
    wig_deposit_reminder_sent = db.Column(db.Boolean, default=False)  # Rappel envoyé ?

    # Mensurations et notes pour la prestation
    head_size_at_booking = db.Column(db.String(50), nullable=True)  # Tour de tête au moment du RDV
    client_notes = db.Column(db.Text, nullable=True)                 # Demandes particulières
    admin_notes = db.Column(db.Text, nullable=True)                  # Notes internes

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "service_id": self.service_id,
            "service_name": self.service.name if self.service else None,
            "variant_id": self.variant_id,
            "variant_label": self.variant.label if self.variant else None,
            "scheduled_at": self.scheduled_at.isoformat(),
            "status": self.status,
            "deposit_paid": self.deposit_paid,
            "total_price": self.total_price,
            "deposit_amount": self.deposit_amount,
            "wig_deposit_received": self.wig_deposit_received,
            "client_notes": self.client_notes,
            "selected_options": [o.to_dict() for o in self.selected_options],
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self):
        return f"<Appointment #{self.id} — {self.scheduled_at}>"
