"""
models/product_variant.py — Déclinaisons d'une perruque.
Chaque variante = une combinaison longueur + densité + type de bonnet + couleur.
"""
from backend.extensions import db


class ProductVariant(db.Model):
    __tablename__ = "product_variants"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)

    # Attributs de déclinaison
    length = db.Column(db.String(20), nullable=True)       # Ex: '10"', '16"', '22"', '28"'
    density = db.Column(db.String(20), nullable=True)      # Ex: '130%', '180%', '250%'
    cap_type = db.Column(db.String(80), nullable=True)     # Ex: 'Lace Front', 'Full Lace', '360 Lace'
    color = db.Column(db.String(80), nullable=True)        # Ex: 'Natural Black', 'Ombre', 'Blonde'
    texture = db.Column(db.String(80), nullable=True)      # Ex: 'Straight', 'Body Wave', 'Curly'

    # Supplément de prix par rapport au prix de base du produit
    price_modifier = db.Column(db.Float, nullable=False, default=0.0)

    # Stock disponible (0 = rupture)
    stock = db.Column(db.Integer, nullable=False, default=0)

    # SKU unique pour la gestion de stock
    sku = db.Column(db.String(100), unique=True, nullable=True)

    is_active = db.Column(db.Boolean, default=True)

    def get_final_price(self):
        """Retourne le prix final = prix de base + modificateur."""
        return round(self.product.base_price + self.price_modifier, 2)

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "length": self.length,
            "density": self.density,
            "cap_type": self.cap_type,
            "color": self.color,
            "texture": self.texture,
            "price_modifier": self.price_modifier,
            "final_price": self.get_final_price(),
            "stock": self.stock,
            "stock_quantity": self.stock,
            "sku": self.sku,
            "in_stock": self.stock > 0,
        }

    def __repr__(self):
        return f"<Variant {self.sku or self.id}>"
