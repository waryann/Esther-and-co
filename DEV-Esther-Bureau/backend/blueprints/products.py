"""
blueprints/products.py — Routes du catalogue produits.
/api/products/           GET   → Liste tous les produits actifs
/api/products/<id>       GET   → Détail d'un produit avec ses variantes
/api/products/           POST  → Créer un produit (admin)
/api/products/<id>       PUT   → Modifier un produit (admin)
/api/products/<id>       DELETE → Désactiver un produit (admin)
"""
from flask import Blueprint, request, jsonify
from backend.extensions import db
from backend.models.product import Product
from backend.models.product_variant import ProductVariant

products_bp = Blueprint("products", __name__, url_prefix="/api/products")


@products_bp.route("/", methods=["GET"])
def get_products():
    """Liste tous les produits actifs, avec filtre par catégorie optionnel."""
    category = request.args.get("category")
    
    query = Product.query.filter_by(is_active=True)
    
    if category:
        query = query.filter_by(category=category)
        
    products = query.order_by(Product.created_at.desc()).all()
    # Retourne les produits avec leurs variantes
    return jsonify([p.to_dict(include_variants=True) for p in products]), 200


@products_bp.route("/<int:product_id>", methods=["GET"])
def get_product(product_id):
    """Retourne le détail d'un produit avec toutes ses déclinaisons/variantes."""
    product = Product.query.filter_by(id=product_id, is_active=True).first_or_404()
    return jsonify(product.to_dict(include_variants=True)), 200


@products_bp.route("/", methods=["POST"])
def create_product():
    """Obsolète - Géré par le blueprint admin"""
    return jsonify({"error": "Utilisez les routes d'administration"}), 403


@products_bp.route("/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    """Obsolète - Géré par le blueprint admin"""
    return jsonify({"error": "Utilisez les routes d'administration"}), 403


@products_bp.route("/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    """Obsolète - Géré par le blueprint admin"""
    return jsonify({"error": "Utilisez les routes d'administration"}), 403
