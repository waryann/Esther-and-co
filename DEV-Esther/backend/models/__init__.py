"""
models/__init__.py — Importe tous les modèles pour que SQLAlchemy les connaisse.
Doit être importé APRÈS db.init_app(app) dans create_app().
"""
from backend.models.user import User
from backend.models.product import Product
from backend.models.product_variant import ProductVariant
from backend.models.service import Service
from backend.models.appointment import Appointment
from backend.models.order import Order, OrderItem

__all__ = [
    "User",
    "Product",
    "ProductVariant",
    "Service",
    "Appointment",
    "Order",
    "OrderItem",
]
