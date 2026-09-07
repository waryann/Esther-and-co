"""
services/appointment_service.py — Logique métier pour les rendez-vous.
Gère le calcul des créneaux disponibles selon la durée variable de chaque prestation.
"""
from datetime import datetime, timedelta
from backend.models.appointment import Appointment
from backend.models.service import Service


# Horaires d'ouverture du salon (à configurer selon les besoins)
OPENING_HOUR = 9    # 09h00
CLOSING_HOUR = 19   # 19h00
WORKING_DAYS = [0, 1, 2, 3, 4, 5]  # Lundi (0) à Samedi (5), Dimanche exclu


def get_available_slots(date: datetime.date, service_id: int) -> list[dict]:
    """
    Retourne les créneaux disponibles pour une prestation donnée un jour donné.

    Args:
        date: La date souhaitée.
        service_id: L'identifiant de la prestation.

    Returns:
        Liste de dict {'start': datetime, 'end': datetime, 'available': bool}

    TODO: Implémenter la logique complète de vérification des conflits.
    """
    service = Service.query.get(service_id)
    if not service:
        return []

    slots = []
    duration = timedelta(minutes=service.duration_minutes)

    current = datetime.combine(date, datetime.min.time()).replace(hour=OPENING_HOUR)
    closing = datetime.combine(date, datetime.min.time()).replace(hour=CLOSING_HOUR)

    while current + duration <= closing:
        slot_end = current + duration

        # TODO: Vérifier si ce créneau est déjà occupé (query Appointment)
        is_available = True  # Placeholder

        slots.append({
            "start": current.isoformat(),
            "end": slot_end.isoformat(),
            "available": is_available,
        })
        current = slot_end  # Pas de chevauchement

    return slots


def check_slot_availability(scheduled_at: datetime, service_id: int) -> bool:
    """
    Vérifie si un créneau précis est disponible.

    TODO: Implémenter la vérification des conflits en base de données.
    """
    # Placeholder
    return True
