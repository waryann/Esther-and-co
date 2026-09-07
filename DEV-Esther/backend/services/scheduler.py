"""
services/scheduler.py - Tâches planifiées (Cron jobs).
Vérifie les RDV prévus dans 48h et envoie un rappel par SMS/Email pour déposer la perruque.
"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timedelta
from backend.extensions import db
from backend.models.appointment import Appointment
from backend.services.notification_service import send_sms, send_email
import logging

logger = logging.getLogger(__name__)

def check_and_send_reminders(app):
    """
    Vérifie les RDV dans 48h et envoie un rappel si ce n'est pas encore fait.
    """
    with app.app_context():
        now = datetime.utcnow()
        # On cherche les RDV dans 48 heures (marge de +/- 1 heure pour éviter de les manquer)
        target_start = now + timedelta(hours=47)
        target_end = now + timedelta(hours=49)

        appointments = Appointment.query.filter(
            Appointment.scheduled_at >= target_start,
            Appointment.scheduled_at <= target_end,
            Appointment.status == 'confirmed',
            Appointment.wig_deposit_received == False,
            Appointment.wig_deposit_reminder_sent == False
        ).all()

        for appt in appointments:
            if not appt.client:
                continue
            
            client_name = f"{appt.client.first_name} {appt.client.last_name}"
            appt_time = appt.scheduled_at.strftime("%d/%m/%Y à %H:%M")
            
            # --- SMS ---
            sms_text = (
                f"Bonjour {client_name}, "
                f"Rappel Est'Hair : Votre RDV est prévu le {appt_time}. "
                f"N'oubliez pas de déposer votre perruque au salon aujourd'hui ou demain au plus tard pour la préparation. "
                f"À très vite !"
            )
            if appt.client.phone:
                send_sms(appt.client.phone, sms_text)
                
            # --- Email ---
            if appt.client.email:
                email_html = f"""
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; text-align: center;">
                    <h2 style="color: #D4AF37;">Rappel de dépôt - Est'Hair</h2>
                    <p>Bonjour {client_name},</p>
                    <p>Votre rendez-vous est prévu le <strong>{appt_time}</strong>.</p>
                    <p>Pour nous permettre de préparer votre prestation dans les meilleures conditions, 
                    <strong>merci de bien vouloir déposer votre perruque au salon d'ici demain.</strong></p>
                    <p>Si vous l'avez déjà déposée, vous pouvez ignorer ce message.</p>
                    <br>
                    <p>À très bientôt dans notre salon !</p>
                </div>
                """
                send_email(
                    to_email=appt.client.email,
                    subject="Rappel : Dépôt de votre perruque 🎀",
                    html_content=email_html
                )

            # Marquer comme envoyé
            appt.wig_deposit_reminder_sent = True
            db.session.commit()
            
            logger.info(f"Rappel 48h envoyé à {client_name} (RDV #{appt.id})")

def start_scheduler(app):
    """
    Initialise et démarre le scheduler.
    """
    scheduler = BackgroundScheduler()
    # Exécuter la vérification toutes les heures
    scheduler.add_job(
        func=check_and_send_reminders,
        trigger=IntervalTrigger(hours=1),
        args=[app],
        id='send_48h_reminders',
        name='Send 48h wig deposit reminders',
        replace_existing=True
    )
    scheduler.start()
    logger.info("Background Scheduler démarré (Tâches : Rappels 48h)")
