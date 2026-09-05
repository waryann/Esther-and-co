"""
blueprints/__init__.py — Package blueprints.
"""
from backend.blueprints.auth import auth_bp
from backend.blueprints.products import products_bp
from backend.blueprints.orders import orders_bp
from backend.blueprints.appointments import appointments_bp
from backend.blueprints.payments import payments_bp
from backend.blueprints.admin import admin_bp

__all__ = [
    "auth_bp",
    "products_bp",
    "orders_bp",
    "appointments_bp",
    "payments_bp",
    "admin_bp",
]
