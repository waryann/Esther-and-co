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
import stripe
from flask import current_app

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

    # Le RDV est créé en statut 'pending' (en attente de paiement)
    appointment = Appointment(
        user_id=data["user_id"],
        service_id=data["service_id"],
        scheduled_at=scheduled_at,
        head_size_at_booking=data["head_size"],
        client_notes=data["client_notes"],
        status="pending",
        deposit_paid=False
    )

    db.session.add(appointment)
    db.session.commit()

    # Configuration Stripe
    stripe.api_key = current_app.config.get("STRIPE_SECRET_KEY")
    if not stripe.api_key:
        # Fallback pour le dev si Stripe n'est pas configuré
        appointment.status = "confirmed"
        appointment.deposit_paid = True
        appointment.deposit_paid_at = datetime.utcnow()
        db.session.commit()
        send_appointment_confirmation(appointment)
        return jsonify({"message": "Rendez-vous confirmé (Mode Dev)", "appointment": appointment.to_dict()}), 201

    try:
        # Calcul de l'acompte (30% du prix de la prestation par défaut)
        service = Service.query.get(data["service_id"])
        acompte_amount = int(service.price * 0.30 * 100) # Stripe prend des centimes

        # Création de la session Stripe
        frontend_url = request.headers.get("Origin", "http://localhost:5173")
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'eur',
                    'product_data': {
                        'name': f"Acompte - {service.name}",
                        'description': f"Rendez-vous le {scheduled_at.strftime('%d/%m/%Y à %H:%M')}",
                    },
                    'unit_amount': acompte_amount,
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f"{frontend_url}/booking/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{frontend_url}/booking?canceled=true",
            client_reference_id=str(appointment.id),
        )

        return jsonify({
            "message": "Session de paiement créée",
            "checkout_url": session.url
        }), 200

    except Exception as e:
        db.session.delete(appointment)
        db.session.commit()
        return jsonify({"error": str(e)}), 500

@appointments_bp.route("/confirm-payment", methods=["GET"])
def confirm_payment():
    session_id = request.args.get("session_id")
    if not session_id:
        return jsonify({"error": "session_id requis"}), 400

    stripe.api_key = current_app.config.get("STRIPE_SECRET_KEY")
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        if session.payment_status == "paid":
            appointment_id = int(session.client_reference_id)
            appointment = Appointment.query.get(appointment_id)
            
            if appointment and appointment.status == "pending":
                appointment.status = "confirmed"
                appointment.deposit_paid = True
                appointment.deposit_paid_at = datetime.utcnow()
                db.session.commit()
                
                # Envoi du SMS
                send_appointment_confirmation(appointment)
                
            return jsonify({"status": "success", "appointment": appointment.to_dict() if appointment else None}), 200
        else:
            return jsonify({"status": "unpaid"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@appointments_bp.route("/", methods=["GET"])
def get_my_appointments():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id requis"}), 400

    appointments = Appointment.query.filter_by(user_id=user_id).order_by(Appointment.scheduled_at.desc()).all()
    return jsonify([appt.to_dict() for appt in appointments])
