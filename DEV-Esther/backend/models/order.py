"""
models/order.py — Commandes e-commerce (panier → payé → expédié).
"""
from datetime import datetime
from backend.extensions import db


class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    # Statuts : 'cart' → 'pending' → 'paid' → 'shipped' → 'delivered' → 'cancelled'
    status = db.Column(db.String(30), nullable=False, default="cart")

    # Montants
    subtotal = db.Column(db.Float, nullable=False, default=0.0)
    shipping_cost = db.Column(db.Float, nullable=False, default=0.0)
    total_amount = db.Column(db.Float, nullable=False, default=0.0)

    # Adresse de livraison (stockée en JSON texte pour la flexibilité)
    shipping_address = db.Column(db.Text, nullable=True)

    # Référence de transaction (pour paiement futur)
    payment_reference = db.Column(db.String(200), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # --- Relations ---
    items = db.relationship("OrderItem", backref="order", lazy=True, cascade="all, delete-orphan")

    def calculate_total(self):
        """Recalcule et met à jour les totaux de la commande."""
        self.subtotal = sum(item.subtotal for item in self.items)
        self.total_amount = round(self.subtotal + self.shipping_cost, 2)

    def to_dict(self, include_items=False):
        data = {
            "id": self.id,
            "status": self.status,
            "subtotal": self.subtotal,
            "shipping_cost": self.shipping_cost,
            "total_amount": self.total_amount,
            "created_at": self.created_at.isoformat(),
        }
        if include_items:
            data["items"] = [i.to_dict() for i in self.items]
        return data

    def __repr__(self):
        return f"<Order #{self.id} — {self.status}>"


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=True)
    variant_id = db.Column(db.Integer, db.ForeignKey("product_variants.id"), nullable=True)

    quantity = db.Column(db.Integer, nullable=False, default=1)

    # Prix unitaire au moment de l'achat (snapshot pour éviter les dérives de prix)
    unit_price = db.Column(db.Float, nullable=False)

    @property
    def subtotal(self):
        return round(self.unit_price * self.quantity, 2)

    def to_dict(self):
        return {
            "id": self.id,
            "variant_id": self.variant_id,
            "quantity": self.quantity,
            "unit_price": self.unit_price,
            "subtotal": self.subtotal,
        }

    def __repr__(self):
        return f"<OrderItem {self.quantity}x variant#{self.variant_id}>"
