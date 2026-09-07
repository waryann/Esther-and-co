"""
models/__init__.py — Importe tous les modèles pour que SQLAlchemy les connaisse.
Doit être importé APRÈS db.init_app(app) dans create_app().
"""
from backend.models.user import User
from backend.models.product import Product
from backend.models.product_variant import ProductVariant
from backend.models.service import Service
from backend.models.service_variant import ServiceVariant
from backend.models.service_option import ServiceOption
from backend.models.appointment import Appointment
from backend.models.appointment_option import AppointmentOption
from backend.models.order import Order, OrderItem

__all__ = [
    "User",
    "Product",
    "ProductVariant",
    "Service",
    "ServiceVariant",
    "ServiceOption",
    "Appointment",
    "AppointmentOption",
    "Order",
    "OrderItem",
]
