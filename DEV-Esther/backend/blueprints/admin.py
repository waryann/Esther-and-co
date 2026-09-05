"""
blueprints/admin.py — Routes du panel d'administration.
Accès réservé aux utilisateurs avec role='admin'.
/api/admin/dashboard                  GET    → Stats globales
/api/admin/appointments               GET    → Tous les RDV
/api/admin/appointments/<id>          PUT    → Modifier statut d'un RDV
/api/admin/appointments/<id>/sms      POST   → Envoyer SMS manuellement
/api/admin/orders                     GET    → Toutes les commandes
/api/admin/orders/<id>                PUT    → Modifier statut d'une commande
/api/admin/products                   GET    → Tous les produits
/api/admin/products                   POST   → Créer un produit
/api/admin/products/<id>              PUT    → Modifier un produit (stock, prix)
/api/admin/services                   GET    → Toutes les prestations
/api/admin/services                   POST   → Créer une prestation
"""
from flask import Blueprint, request, jsonify
import os
from datetime import datetime, date
from backend.extensions import db
from backend.models.appointment import Appointment
from backend.models.order import Order, OrderItem
from backend.models.product import Product
from backend.models.service import Service
from backend.models.user import User
from backend.services.notification_service import send_sms

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


# ─────────────────────────────────────────
# DASHBOARD
# ─────────────────────────────────────────
@admin_bp.route("/dashboard", methods=["GET"])
def dashboard():
    """Stats globales : RDV du jour, revenus, commandes récentes."""
    today_start = datetime.combine(date.today(), datetime.min.time())
    today_end = datetime.combine(date.today(), datetime.max.time())

    # RDV du jour
    appointments_today = Appointment.query.filter(
        Appointment.scheduled_at >= today_start,
        Appointment.scheduled_at <= today_end,
        Appointment.status != 'cancelled'
    ).count()

    # RDV en attente de confirmation
    appointments_pending = Appointment.query.filter_by(status='pending').count()

    # Commandes récentes (non-panier)
    recent_orders = Order.query.filter(
        Order.status != 'cart'
    ).order_by(Order.created_at.desc()).limit(10).all()

    # Revenus du mois en cours (commandes payées)
    from datetime import timedelta
    first_of_month = date.today().replace(day=1)
    monthly_revenue = db.session.query(
        db.func.sum(Order.total_amount)
    ).filter(
        Order.status.in_(['paid', 'shipped', 'delivered']),
        Order.created_at >= first_of_month
    ).scalar() or 0.0

    # Stock faible (variants avec stock < 5)
    from backend.models.product_variant import ProductVariant
    low_stock = ProductVariant.query.filter(
        ProductVariant.stock < 5,
        ProductVariant.stock > 0
    ).count()

    return jsonify({
        "appointments_today": appointments_today,
        "appointments_pending": appointments_pending,
        "monthly_revenue": round(monthly_revenue, 2),
        "recent_orders": [{
            **o.to_dict(),
            "client_name": f"{o.client.first_name} {o.client.last_name}" if o.client else "Client inconnu"
        } for o in recent_orders],
        "low_stock_alerts": low_stock,
        "total_clients": User.query.filter_by(role='client').count(),
    })


# ─────────────────────────────────────────
# APPOINTMENTS
# ─────────────────────────────────────────
@admin_bp.route("/appointments", methods=["GET"])
def get_all_appointments():
    """Liste tous les RDV avec filtres optionnels (date, statut)."""
    status_filter = request.args.get("status")
    date_filter = request.args.get("date")

    query = Appointment.query

    if status_filter:
        query = query.filter_by(status=status_filter)

    if date_filter:
        try:
            target_date = datetime.strptime(date_filter, "%Y-%m-%d").date()
            day_start = datetime.combine(target_date, datetime.min.time())
            day_end = datetime.combine(target_date, datetime.max.time())
            query = query.filter(
                Appointment.scheduled_at >= day_start,
                Appointment.scheduled_at <= day_end
            )
        except ValueError:
            return jsonify({"error": "Format de date invalide"}), 400

    appointments = query.order_by(Appointment.scheduled_at.asc()).all()

    result = []
    for appt in appointments:
        d = appt.to_dict()
        d['client_name'] = f"{appt.client.first_name} {appt.client.last_name}"
        d['client_phone'] = appt.client.phone
        result.append(d)

    return jsonify(result)


@admin_bp.route("/appointments/<int:appointment_id>", methods=["PUT"])
def update_appointment(appointment_id):
    """Modifier le statut d'un RDV ou ajouter des notes admin."""
    appt = Appointment.query.get_or_404(appointment_id)
    data = request.json or {}

    if "status" in data:
        valid_statuses = ['pending', 'confirmed', 'completed', 'cancelled']
        if data["status"] not in valid_statuses:
            return jsonify({"error": f"Statut invalide. Valeurs acceptées: {valid_statuses}"}), 400
        appt.status = data["status"]

    if "admin_notes" in data:
        appt.admin_notes = data["admin_notes"]

    if "wig_deposit_received" in data:
        appt.wig_deposit_received = bool(data["wig_deposit_received"])

    db.session.commit()
    return jsonify({"message": "RDV mis à jour", "appointment": appt.to_dict()})


@admin_bp.route("/appointments/<int:appointment_id>/sms", methods=["POST"])
def send_manual_sms(appointment_id):
    """Envoyer un SMS manuellement à un client depuis le panel admin."""
    appt = Appointment.query.get_or_404(appointment_id)
    data = request.json or {}
    message = data.get("message", "")
    if not message:
        return jsonify({"error": "Le message SMS est requis"}), 400

    success = send_sms(appt.client.phone, message)
    if success:
        return jsonify({"message": "SMS envoyé avec succès"})
    return jsonify({"error": "Échec de l'envoi du SMS"}), 500


# ─────────────────────────────────────────
# ORDERS
# ─────────────────────────────────────────
@admin_bp.route("/orders", methods=["GET"])
def get_all_orders():
    """Liste toutes les commandes (hors paniers)."""
    status_filter = request.args.get("status")
    query = Order.query.filter(Order.status != 'cart')

    if status_filter:
        query = query.filter_by(status=status_filter)

    orders = query.order_by(Order.created_at.desc()).all()

    result = []
    for order in orders:
        d = order.to_dict(include_items=True)
        d['client_name'] = f"{order.client.first_name} {order.client.last_name}"
        d['client_email'] = order.client.email
        result.append(d)

    return jsonify(result)


@admin_bp.route("/orders/<int:order_id>", methods=["PUT"])
def update_order(order_id):
    """Changer le statut d'une commande (ex: paid → shipped)."""
    order = Order.query.get_or_404(order_id)
    data = request.json or {}

    valid_statuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']
    if "status" in data:
        if data["status"] not in valid_statuses:
            return jsonify({"error": f"Statut invalide. Valeurs: {valid_statuses}"}), 400
        order.status = data["status"]

    db.session.commit()
    return jsonify({"message": "Commande mise à jour", "order": order.to_dict()})


# ─────────────────────────────────────────
# PRODUCTS (Stock)
# ─────────────────────────────────────────
@admin_bp.route("/products", methods=["GET"])
def get_all_products():
    """Liste tous les produits avec leurs variantes et stocks."""
    products = Product.query.order_by(Product.created_at.desc()).all()
    return jsonify([p.to_dict(include_variants=True) for p in products])


@admin_bp.route("/products", methods=["POST"])
def create_product():
    """Créer un nouveau produit."""
    data = request.json or {}
    required = ["name", "base_price", "category"]
    if not all(f in data for f in required):
        return jsonify({"error": "Champs requis: name, base_price, category"}), 400

    product = Product(
        name=data["name"],
        description=data.get("description", ""),
        base_price=float(data["base_price"]),
        category=data["category"],
        image_url=data.get("image_url"),
        is_featured=data.get("is_featured", False),
        is_bestseller=data.get("is_bestseller", False),
        is_new=data.get("is_new", True),
        on_sale=data.get("on_sale", False),
        sale_price=float(data["sale_price"]) if data.get("sale_price") else None
    )
    db.session.add(product)
    db.session.commit()
    return jsonify({"message": "Produit créé", "product": product.to_dict()}), 201


@admin_bp.route("/products/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    """Modifier un produit (prix, description, stock via ses variantes)."""
    product = Product.query.get_or_404(product_id)
    data = request.json or {}

    if "name" in data:
        product.name = data["name"]
    if "base_price" in data:
        product.base_price = float(data["base_price"])
    if "description" in data:
        product.description = data["description"]
    if "is_active" in data:
        product.is_active = bool(data["is_active"])
    if "is_featured" in data:
        product.is_featured = bool(data["is_featured"])
    if "is_bestseller" in data:
        product.is_bestseller = bool(data["is_bestseller"])
    if "is_new" in data:
        product.is_new = bool(data["is_new"])
    if "on_sale" in data:
        product.on_sale = bool(data["on_sale"])
    if "sale_price" in data:
        product.sale_price = float(data["sale_price"]) if data["sale_price"] is not None and data["sale_price"] != "" else None

    # Mise à jour du stock des variantes
    if "variants" in data:
        from backend.models.product_variant import ProductVariant
        for v_data in data["variants"]:
            variant = ProductVariant.query.get(v_data.get("id"))
            if variant and variant.product_id == product_id:
                if "stock_quantity" in v_data:
                    variant.stock = int(v_data["stock_quantity"])
                if "stock" in v_data:
                    variant.stock = int(v_data["stock"])
                if "price_modifier" in v_data:
                    variant.price_modifier = float(v_data["price_modifier"])

    db.session.commit()
    return jsonify({"message": "Produit mis à jour", "product": product.to_dict(include_variants=True)})


# ─────────────────────────────────────────
# SERVICES
# ─────────────────────────────────────────
@admin_bp.route("/services", methods=["GET"])
def get_services():
    """Liste toutes les prestations."""
    services = Service.query.all()
    return jsonify([s.to_dict() for s in services])


@admin_bp.route("/services", methods=["POST"])
def create_service():
    """Créer une nouvelle prestation."""
    data = request.json or {}
    required = ["name", "price", "duration_minutes"]
    if not all(f in data for f in required):
        return jsonify({"error": "Champs requis: name, price, duration_minutes"}), 400

    service = Service(
        name=data["name"],
        description=data.get("description", ""),
        price=float(data["price"]),
        duration_minutes=int(data["duration_minutes"]),
        requires_wig_deposit=data.get("requires_wig_deposit", False),
    )
    db.session.add(service)
    db.session.commit()
    return jsonify({"message": "Prestation créée", "service": service.to_dict()}), 201


@admin_bp.route("/upload", methods=["POST"])
def upload_file():
    """Téléverser une photo avec option de détourage automatique."""
    if "file" not in request.files:
        return jsonify({"error": "Aucun fichier fourni"}), 400
    
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Nom de fichier vide"}), 400
        
    remove_bg = request.form.get("remove_bg") == "true"
    
    from flask import current_app
    from werkzeug.utils import secure_filename
    import uuid
    import io
    
    filename = secure_filename(file.filename)
    ext = filename.rsplit(".", 1)[1].lower() if "." in filename else ""
    if ext not in current_app.config["ALLOWED_EXTENSIONS"]:
        return jsonify({"error": f"Format non supporté. Formats admis : {current_app.config['ALLOWED_EXTENSIONS']}"}), 400
        
    # Le détourage produit toujours un PNG pour gérer la transparence
    unique_filename = f"{uuid.uuid4().hex}.png" if remove_bg else f"{uuid.uuid4().hex}.{ext}"
    upload_path = os.path.join(current_app.config["UPLOAD_FOLDER"], unique_filename)
    
    try:
        detoured = False
        if remove_bg:
            try:
                from rembg import remove
                from PIL import Image
                
                input_data = file.read()
                output_data = remove(input_data)
                
                img = Image.open(io.BytesIO(output_data))
                img.save(upload_path, "PNG")
                detoured = True
            except Exception as bg_err:
                current_app.logger.warning(f"Échec détourage (fallback vers image originale) : {bg_err}")
                file.seek(0)
                # Changer le nom de fichier pour correspondre à l'extension originale
                unique_filename = f"{uuid.uuid4().hex}.{ext}"
                upload_path = os.path.join(current_app.config["UPLOAD_FOLDER"], unique_filename)
                file.save(upload_path)
        else:
            file.save(upload_path)
            
        image_url = f"/static/uploads/{unique_filename}"
        return jsonify({
            "message": "Fichier téléversé avec succès",
            "image_url": image_url,
            "detoured": detoured,
            "warning": "Détourage automatique indisponible (machine hors-ligne pour charger le modèle d'IA). Image d'origine conservée." if (remove_bg and not detoured) else None
        }), 200
        
    except Exception as e:
        import traceback
        current_app.logger.error(f"Erreur d'upload générale : {e}\n{traceback.format_exc()}")
        return jsonify({"error": f"Erreur lors du téléversement : {str(e)}"}), 500


