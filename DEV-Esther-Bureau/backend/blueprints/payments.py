"""
blueprints/payments.py — Routes de gestion des paiements et acomptes.
/api/payments/deposit/<appointment_id>  POST → Payer l'acompte d'un RDV
/api/payments/order/<order_id>          POST → Payer une commande
/api/payments/webhook                   POST → Webhook paiement (Stripe futur)
"""
from flask import Blueprint, request, jsonify, os
import stripe
from backend.models.appointment import Appointment
from backend.extensions import db
from datetime import datetime

payments_bp = Blueprint("payments", __name__, url_prefix="/api/payments")


@payments_bp.route("/deposit/<int:appointment_id>", methods=["POST"])
def pay_deposit(appointment_id):
    appointment = Appointment.query.get_or_404(appointment_id)
    
    if appointment.deposit_paid:
        return jsonify({"error": "L'acompte a déjà été payé pour ce rendez-vous"}), 400

    # L'URL de base du frontend (idéalement configuré en variable d'environnement)
    # Pour Render ou localhost
    frontend_url = request.headers.get("Origin", "http://localhost:5173")

    try:
        # Création de la session Stripe Checkout
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "eur",
                        "product_data": {
                            "name": f"Acompte - {appointment.service.name}",
                            "description": f"Rendez-vous le {appointment.scheduled_at.strftime('%d/%m/%Y à %H:%M')}",
                        },
                        "unit_amount": int(appointment.deposit_amount * 100), # Montant en centimes
                    },
                    "quantity": 1,
                }
            ],
            mode="payment",
            success_url=f"{frontend_url}/booking/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{frontend_url}/booking/cancel",
            client_reference_id=str(appointment.id),
        )

        return jsonify({
            "checkout_url": checkout_session.url
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@payments_bp.route("/verify-session/<session_id>", methods=["GET"])
def verify_session(session_id):
    """Vérifie le statut d'une session de paiement Stripe."""
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        if session.payment_status == "paid":
            appointment_id = int(session.client_reference_id)
            appointment = Appointment.query.get(appointment_id)
            
            if appointment and not appointment.deposit_paid:
                appointment.deposit_paid = True
                appointment.status = "confirmed"
                appointment.deposit_paid_at = datetime.utcnow()
                db.session.commit()
                
                # Envoi du SMS de confirmation
                from backend.blueprints.appointments import send_appointment_confirmation
                send_appointment_confirmation(appointment)
                
            return jsonify({"status": "success", "appointment_id": appointment_id}), 200
        else:
            return jsonify({"status": "pending"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@payments_bp.route("/webhook", methods=["POST"])
def payment_webhook():
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get("Stripe-Signature")
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET") # À configurer sur Render

    try:
        if webhook_secret:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        else:
            # Sans secret (mode dev), on parse juste l'event
            import json
            event = stripe.Event.construct_from(json.loads(payload), stripe.api_key)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    if event.type == "checkout.session.completed":
        session = event.data.object
        if session.payment_status == "paid":
            appointment_id = int(session.client_reference_id)
            appointment = Appointment.query.get(appointment_id)
            
            if appointment and not appointment.deposit_paid:
                appointment.deposit_paid = True
                appointment.status = "confirmed"
                appointment.deposit_paid_at = datetime.utcnow()
                db.session.commit()
                
                from backend.blueprints.appointments import send_appointment_confirmation
                send_appointment_confirmation(appointment)

    return jsonify({"status": "success"}), 200


@payments_bp.route("/order/<int:order_id>", methods=["POST"])
def pay_order(order_id):
    return jsonify({"message": f"Route pay_order {order_id} — à implémenter"}), 501
