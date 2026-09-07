"""
models/appointment_option.py — Option choisie par la cliente pour un RDV (ex: coloration),
avec la photo d'inspiration éventuellement jointe.
"""
from backend.extensions import db


class AppointmentOption(db.Model):
    __tablename__ = "appointment_options"

    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey("appointments.id"), nullable=False)
    option_id = db.Column(db.Integer, db.ForeignKey("service_options.id"), nullable=False)

    # Prix figé au moment de la réservation
    price = db.Column(db.Float, nullable=False)

    # Photo d'inspiration envoyée par la cliente (chemin relatif, ex: /static/uploads/xxx.jpg)
    photo_url = db.Column(db.String(300), nullable=True)

    option = db.relationship("ServiceOption")

    def to_dict(self):
        return {
            "id": self.id,
            "option_id": self.option_id,
            "option_name": self.option.name if self.option else None,
            "price": self.price,
            "photo_url": self.photo_url,
        }

    def __repr__(self):
        return f"<AppointmentOption {self.option_id} for appt#{self.appointment_id}>"
