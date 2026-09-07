"""
blueprints/orders.py — Routes de gestion des commandes (panier + checkout).
/api/orders/cart         GET   → Panier actif de l'utilisateur
/api/orders/cart/add     POST  → Ajouter un article au panier
/api/orders/cart/remove  DELETE → Retirer un article du panier
/api/orders/             POST  → Valider la commande (checkout)
/api/orders/             GET   → Historique des commandes (client)
/api/orders/<id>         GET   → Détail d'une commande
"""
from flask import Blueprint, request, jsonify

orders_bp = Blueprint("orders", __name__, url_prefix="/api/orders")


@orders_bp.route("/cart", methods=["GET"])
def get_cart():
    # TODO: Retourner le panier actif (order avec status='cart')
    return jsonify({"message": "Route get_cart — à implémenter"}), 501


@orders_bp.route("/cart/add", methods=["POST"])
def add_to_cart():
    # TODO: Ajouter une variante au panier
    return jsonify({"message": "Route add_to_cart — à implémenter"}), 501


@orders_bp.route("/cart/remove", methods=["DELETE"])
def remove_from_cart():
    # TODO: Retirer un article du panier
    return jsonify({"message": "Route remove_from_cart — à implémenter"}), 501


@orders_bp.route("/", methods=["POST"])
def checkout():
    # TODO: Transformer le panier en commande et initier le paiement
    return jsonify({"message": "Route checkout — à implémenter"}), 501


@orders_bp.route("/", methods=["GET"])
def get_orders():
    # TODO: Historique des commandes du client connecté
    return jsonify({"message": "Route get_orders — à implémenter"}), 501


@orders_bp.route("/<int:order_id>", methods=["GET"])
def get_order(order_id):
    # TODO: Détail d'une commande spécifique
    return jsonify({"message": f"Route get_order {order_id} — à implémenter"}), 501
