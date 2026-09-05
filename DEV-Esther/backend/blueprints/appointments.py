"""
blueprints/appointments.py — Routes de gestion des rendez-vous.
/api/appointments/slots         GET   → Créneaux disponibles (date + service_id)
/api/appointments/              POST  → Créer un RDV + initier acompte
/api/appointments/              GET   → Mes rendez-vous (client)
"""
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from backend.extensions import db
from backend.models.appointment import Appointment
from backend.models.service import Service
from backend.models.user import User
from backend.services.notification_service import send_appointment_confirmation

appointments_bp = Blueprint("appointments", __name__, url_prefix="/api/appointments")

# Horaires d'ouverture simulés (10h à 18h)
BUSINESS_HOURS_START = 10
BUSINESS_HOURS_END = 18

@appointments_bp.route("/slots", methods=["GET"])
def get_available_slots():
    date_str = request.args.get("date")
    if not date_str:
        return jsonify({"error": "La date est requise (YYYY-MM-DD)"}), 400

    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Format de date invalide (YYYY-MM-DD)"}), 400

    # Récupérer les rendez-vous existants pour cette date
    start_of_day = datetime.combine(target_date, datetime.min.time())
    end_of_day = datetime.combine(target_date, datetime.max.time())
    
    existing_appointments = Appointment.query.filter(
        Appointment.scheduled_at >= start_of_day,
        Appointment.scheduled_at <= end_of_day,
        Appointment.status != 'cancelled'
    ).all()

    booked_times = [appt.scheduled_at.strftime("%H:%M") for appt in existing_appointments]

    # Générer les créneaux toutes les 2 heures (Pose standard)
    slots = []
    current_hour = BUSINESS_HOURS_START
    while current_hour < BUSINESS_HOURS_END:
        slot_time = f"{current_hour:02d}:00"
        if slot_time not in booked_times:
            slots.append(slot_time)
        current_hour += 2

    return jsonify({"slots": slots})


@appointments_bp.route("/", methods=["POST"])
def create_appointment():
    data = request.json
    # Validation basique
    required_fields = ["user_id", "service_id", "scheduled_at", "head_size", "client_notes"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Données incomplètes"}), 400

    try:
        scheduled_at = datetime.strptime(data["scheduled_at"], "%Y-%m-%dT%H:%M")
    except ValueError:
        return jsonify({"error": "Format de date invalide (YYYY-MM-DDTHH:MM)"}), 400

    # Création du RDV en simulant le paiement de l'acompte
    appointment = Appointment(
        user_id=data["user_id"],
        service_id=data["service_id"],
        scheduled_at=scheduled_at,
        head_size_at_booking=data["head_size"],
        client_notes=data["client_notes"],
        status="confirmed",  # Simulé : L'acompte est payé
        deposit_paid=True,
        deposit_paid_at=datetime.utcnow()
    )

    db.session.add(appointment)
    db.session.commit()

    # Envoi du SMS de confirmation
    send_appointment_confirmation(appointment)

    return jsonify({"message": "Rendez-vous confirmé", "appointment": appointment.to_dict()}), 201


@appointments_bp.route("/", methods=["GET"])
def get_my_appointments():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id requis"}), 400

    appointments = Appointment.query.filter_by(user_id=user_id).order_by(Appointment.scheduled_at.desc()).all()
    return jsonify([appt.to_dict() for appt in appointments])
