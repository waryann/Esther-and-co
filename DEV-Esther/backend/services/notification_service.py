"""
services/notification_service.py — Envoi de rappels et notifications clients.
Gère les rappels de dépôt de perruque, confirmations de RDV, etc.
"""
from twilio.rest import Client
from flask import current_app
import logging

logger = logging.getLogger(__name__)

def get_twilio_client():
    account_sid = current_app.config.get("TWILIO_ACCOUNT_SID")
    auth_token = current_app.config.get("TWILIO_AUTH_TOKEN")
    if not account_sid or not auth_token:
        logger.warning("Twilio n'est pas configuré. Les SMS ne seront pas envoyés.")
        return None
    return Client(account_sid, auth_token)

def send_sms(to_number: str, body: str) -> bool:
    client = get_twilio_client()
    if not client:
        print(f"[SIMULATION SMS] À : {to_number} | Message : {body}")
        return True

    from_number = current_app.config.get("TWILIO_PHONE_NUMBER")
    try:
        message = client.messages.create(
            body=body,
            from_=from_number,
            to=to_number
        )
        logger.info(f"SMS envoyé avec succès. SID: {message.sid}")
        return True
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi du SMS : {e}")
        return False


def send_wig_deposit_reminder(appointment) -> bool:
    """
    Envoie un rappel au client pour déposer sa perruque avant le RDV.
    """
    client = appointment.client
    message = f"Bonjour {client.first_name}, n'oubliez pas de déposer votre perruque chez EST'HAIR & CO au moins 48h avant votre RDV du {appointment.scheduled_at.strftime('%d/%m/%Y à %H:%M')}."
    
    success = send_sms(client.phone, message)
    if success:
        appointment.wig_deposit_reminder_sent = True
    return success


def send_appointment_confirmation(appointment) -> bool:
    """
    Envoie une confirmation de RDV au client.
    """
    client = appointment.client
    message = f"EST'HAIR & CO : Votre RDV du {appointment.scheduled_at.strftime('%d/%m/%Y à %H:%M')} est confirmé. Au plaisir de vous recevoir !"
    return send_sms(client.phone, message)


def send_deposit_reminder(appointment) -> bool:
    """
    Rappelle au client de payer son acompte pour valider le RDV.
    """
    client = appointment.client
    message = f"EST'HAIR & CO : N'oubliez pas de régler votre acompte pour confirmer votre RDV du {appointment.scheduled_at.strftime('%d/%m/%Y à %H:%M')}."
    return send_sms(client.phone, message)
