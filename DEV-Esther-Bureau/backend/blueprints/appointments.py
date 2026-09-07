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
from backend.models.appointment_option import AppointmentOption
from backend.models.service import Service
from backend.models.service_variant import ServiceVariant
from backend.models.service_option import ServiceOption
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

    service = Service.query.get(data["service_id"])
    if not service:
        return jsonify({"error": "Prestation introuvable"}), 404

    # Prix de base : celui de la déclinaison choisie (pack) ou celui de la prestation
    variant = None
    base_price = service.price
    if data.get("variant_id"):
        variant = ServiceVariant.query.filter_by(id=data["variant_id"], service_id=service.id).first()
        if not variant:
            return jsonify({"error": "Déclinaison invalide pour cette prestation"}), 400
        base_price = variant.price
    elif service.is_pack:
        return jsonify({"error": "Cette prestation nécessite de choisir une déclinaison (variant_id)"}), 400

    # Options sélectionnées (ex: coloration), avec photo d'inspiration éventuelle
    selected_options = []
    options_total = 0.0
    for opt_data in data.get("options", []):
        option = ServiceOption.query.filter_by(id=opt_data.get("option_id"), service_id=service.id).first()
        if not option:
            return jsonify({"error": f"Option invalide pour cette prestation: {opt_data.get('option_id')}"}), 400
        options_total += option.price
        selected_options.append(AppointmentOption(
            option_id=option.id,
            price=option.price,
            photo_url=opt_data.get("photo_url") if option.allows_photo else None,
        ))

    total_price = round(base_price + options_total, 2)
    deposit_amount = service.get_deposit_amount(base_price=total_price)

    # Création du RDV en simulant le paiement de l'acompte
    appointment = Appointment(
        user_id=data["user_id"],
        service_id=data["service_id"],
        variant_id=variant.id if variant else None,
        scheduled_at=scheduled_at,
        head_size_at_booking=data["head_size"],
        client_notes=data["client_notes"],
        total_price=total_price,
        deposit_amount=deposit_amount,
        status="confirmed",  # Simulé : L'acompte est payé
        deposit_paid=True,
        deposit_paid_at=datetime.utcnow(),
        selected_options=selected_options,
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
