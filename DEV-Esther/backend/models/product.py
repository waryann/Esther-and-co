"""
models/product.py — Table des produits (perruques + produits d'entretien).
"""
from datetime import datetime
from backend.extensions import db


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    base_price = db.Column(db.Float, nullable=False)

    # 'wig' (perruque) ou 'care' (produit d'entretien)
    category = db.Column(db.String(50), nullable=False, default="wig")

    # Image principale (chemin relatif)
    image_url = db.Column(db.String(300), nullable=True)

    # Cross-selling : produits recommandés avec ce produit
    # (implémenté via une table de jointure plus tard)

    is_active = db.Column(db.Boolean, default=True)
    is_featured = db.Column(db.Boolean, default=False)  # Mis en avant sur la home
    is_bestseller = db.Column(db.Boolean, default=False)
    is_new = db.Column(db.Boolean, default=True)
    on_sale = db.Column(db.Boolean, default=False)
    sale_price = db.Column(db.Float, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # --- Relations ---
    variants = db.relationship("ProductVariant", backref="product", lazy=True, cascade="all, delete-orphan")
    order_items = db.relationship("OrderItem", backref="product", lazy=True)

    def to_dict(self, include_variants=False):
        data = {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "base_price": self.base_price,
            "category": self.category,
            "image_url": self.image_url,
            "is_active": self.is_active,
            "is_featured": self.is_featured,
            "is_bestseller": self.is_bestseller,
            "is_new": self.is_new,
            "on_sale": self.on_sale,
            "sale_price": self.sale_price,
        }
        if include_variants:
            data["variants"] = [v.to_dict() for v in self.variants]
        return data

    def __repr__(self):
        return f"<Product {self.name}>"
