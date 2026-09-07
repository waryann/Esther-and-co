"""
blueprints/services.py — Routes du catalogue des prestations (packs + services simples).
/api/services/           GET   → Liste toutes les prestations actives
/api/services/<id>       GET   → Détail complet d'une prestation (variantes, options, inclus, conditions)
"""
from flask import Blueprint, jsonify
from backend.models.service import Service

services_bp = Blueprint("services", __name__, url_prefix="/api/services")


@services_bp.route("/", methods=["GET"])
def get_services():
    """Liste toutes les prestations actives, avec leurs variantes/options."""
    services = Service.query.filter_by(is_active=True).all()
    return jsonify([s.to_dict(include_details=True) for s in services]), 200


@services_bp.route("/<int:service_id>", methods=["GET"])
def get_service(service_id):
    """Détail complet d'une prestation pour l'écran de détail / la réservation."""
    service = Service.query.filter_by(id=service_id, is_active=True).first_or_404()
    return jsonify(service.to_dict(include_details=True)), 200
