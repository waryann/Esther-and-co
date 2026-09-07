"""
blueprints/payments.py — Routes de gestion des paiements et acomptes.
/api/payments/deposit/<appointment_id>  POST → Payer l'acompte d'un RDV
/api/payments/order/<order_id>          POST → Payer une commande
/api/payments/webhook                   POST → Webhook paiement (Stripe futur)
"""
from flask import Blueprint, request, jsonify

payments_bp = Blueprint("payments", __name__, url_prefix="/api/payments")


@payments_bp.route("/deposit/<int:appointment_id>", methods=["POST"])
def pay_deposit(appointment_id):
    # TODO: Enregistrer le paiement de l'acompte et confirmer le RDV
    return jsonify({"message": f"Route pay_deposit {appointment_id} — à implémenter"}), 501


@payments_bp.route("/order/<int:order_id>", methods=["POST"])
def pay_order(order_id):
    # TODO: Initier le paiement d'une commande
    return jsonify({"message": f"Route pay_order {order_id} — à implémenter"}), 501


@payments_bp.route("/webhook", methods=["POST"])
def payment_webhook():
    # TODO: Recevoir et traiter les webhooks du processeur de paiement (Stripe)
    return jsonify({"message": "Route payment_webhook — à implémenter"}), 501
