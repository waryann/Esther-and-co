import os
import sys
from datetime import datetime, timedelta

# Ajouter le chemin parent au PYTHONPATH pour pouvoir importer backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app import create_app
from backend.extensions import db
from backend.models import (
    User, Product, ProductVariant, Service, ServiceVariant, ServiceOption,
    Appointment, Order, OrderItem,
)

app = create_app("production")

with app.app_context():
    print("Vérification et création des tables de la base de données...")
    db.drop_all()
    db.create_all()
    
    if User.query.first():
        print("✅ Base de données déjà peuplée. Annulation du script pour ne rien écraser.")
        sys.exit(0)

    print("Création des utilisateurs...")
    # Admin
    admin = User(
        email="admin@esthair.com",
        first_name="Esther",
        last_name="Co",
        role="admin",
        phone="+33600000001"
    )
    admin.set_password("admin123")
    db.session.add(admin)

    # Clients
    client1 = User(
        email="marie.dupont@gmail.com",
        first_name="Marie",
        last_name="Dupont",
        role="client",
        phone="+33612345678"
    )
    client1.set_password("client123")
    db.session.add(client1)

    client2 = User(
        email="sophie.martin@yahoo.fr",
        first_name="Sophie",
        last_name="Martin",
        role="client",
        phone="+33789654321"
    )
    client2.set_password("client123")
    db.session.add(client2)

    print("Création des prestations (Services)...")

    # ─── PACK 1 — Flipover (Best-seller) ───
    # NB: durée non précisée par la cliente, placeholder à confirmer.
    pack_flipover = Service(
        name="Pack Flipover (Best-seller)",
        description="La prestation de pose est incluse dans le prix du pack.",
        duration_minutes=180,
        price=200.0,  # prix "à partir de" = variante la moins chère
        deposit_amount=30.0,
        deposit_is_percent=True,
        requires_wig_deposit=False,
        includes="Fourniture des paquets de mèches\nPrestation de pose incluse",
        is_pack=True,
    )
    db.session.add(pack_flipover)
    db.session.flush()
    db.session.add_all([
        ServiceVariant(service_id=pack_flipover.id, label='2 paquets de 16 pouces', length='16"', price=200.0, sort_order=1),
        ServiceVariant(service_id=pack_flipover.id, label='3 paquets de 16 pouces', length='16"', price=265.0, sort_order=2),
        ServiceVariant(service_id=pack_flipover.id, label='3 paquets de 18 pouces', length='18"', price=325.0, sort_order=3),
        ServiceVariant(service_id=pack_flipover.id, label='3 paquets de 20 pouces', length='20"', price=330.0, sort_order=4),
        ServiceVariant(service_id=pack_flipover.id, label='3 paquets de 22 pouces', length='22"', price=420.0, sort_order=5),
        ServiceVariant(service_id=pack_flipover.id, label='3 paquets de 24 pouces', length='24"', price=455.0, sort_order=6),
    ])
    db.session.add_all([
        ServiceOption(service_id=pack_flipover.id, name="Coloration uniforme", price=65.0, allows_photo=True),
        ServiceOption(service_id=pack_flipover.id, name="Coloration balayage ou autre", price=165.0, allows_photo=True),
    ])

    # ─── PACK 2 — Tissage Closure ───
    # NB: prix par longueur non communiqués par la cliente — placeholders à 0€,
    # à mettre à jour depuis l'admin (Réservation > Prestations) dès réception des tarifs.
    pack_closure = Service(
        name="Pack Tissage Closure",
        description="Closure 5x5 Lace HD + 3 boules de mèches + closure de base en 18 pouces. Longueur des mèches au choix.",
        duration_minutes=180,
        price=0.0,
        deposit_amount=30.0,
        deposit_is_percent=True,
        requires_wig_deposit=False,
        includes="Closure 5x5 Lace HD\n3 boules de mèches\nClosure de base en 18 pouces",
        conditions="Tarifs par longueur en attente de confirmation.",
        is_pack=True,
    )
    db.session.add(pack_closure)
    db.session.flush()
    db.session.add_all([
        ServiceVariant(service_id=pack_closure.id, label='20 pouces', length='20"', price=0.0, sort_order=1),
        ServiceVariant(service_id=pack_closure.id, label='22 pouces', length='22"', price=0.0, sort_order=2),
        ServiceVariant(service_id=pack_closure.id, label='24 pouces', length='24"', price=0.0, sort_order=3),
        ServiceVariant(service_id=pack_closure.id, label='26 pouces', length='26"', price=0.0, sort_order=4),
        ServiceVariant(service_id=pack_closure.id, label='28 pouces', length='28"', price=0.0, sort_order=5),
    ])
    db.session.add_all([
        ServiceOption(service_id=pack_closure.id, name="Coloration uniforme", price=65.0, allows_photo=True),
        ServiceOption(service_id=pack_closure.id, name="Coloration balayage ou autre", price=165.0, allows_photo=True),
    ])

    # ─── PACK 3 — Tissage Balayage ───
    # NB: types de balayage et grille de prix non communiqués — un seul style
    # placeholder est créé ici à titre d'exemple ; à compléter depuis l'admin.
    pack_balayage = Service(
        name="Pack Tissage Balayage",
        description="Tissage ouvert + 3 boules de mèches + 1 boule balayée. Le prix varie selon le type de balayage et la longueur choisis.",
        duration_minutes=180,
        price=0.0,
        deposit_amount=30.0,
        deposit_is_percent=True,
        requires_wig_deposit=False,
        includes="Tissage ouvert\n3 boules de mèches\n1 boule balayée",
        conditions="Types de balayage et tarifs par longueur en attente de confirmation.",
        is_pack=True,
    )
    db.session.add(pack_balayage)
    db.session.flush()
    db.session.add_all([
        ServiceVariant(service_id=pack_balayage.id, label='Balayage à définir — 18 pouces', length='18"', style='À définir', price=0.0, sort_order=1),
        ServiceVariant(service_id=pack_balayage.id, label='Balayage à définir — 20 pouces', length='20"', style='À définir', price=0.0, sort_order=2),
        ServiceVariant(service_id=pack_balayage.id, label='Balayage à définir — 22 pouces', length='22"', style='À définir', price=0.0, sort_order=3),
    ])

    # ─── Prestations détaillées (hors packs) ───
    service_tissage_ouvert = Service(
        name="Tissage ouvert",
        description="Brushing, nattes et pose du tissage.",
        duration_minutes=150,  # 2h30
        price=80.0,
        deposit_amount=30.0,
        deposit_is_percent=True,
        requires_wig_deposit=False,
        includes="Brushing\nNattes\nPose du tissage",
    )
    db.session.add(service_tissage_ouvert)

    # NB: durée et détails non précisés par la cliente — placeholders à confirmer.
    service_lace_1306 = Service(
        name="Pose perruque Lace 13x6",
        description="Pose complète indétectable de perruque Lace 13x6.",
        duration_minutes=120,
        price=85.0,
        deposit_amount=30.0,
        deposit_is_percent=True,
        requires_wig_deposit=True,
        includes="Pose complète de la perruque Lace 13x6",
    )
    db.session.add(service_lace_1306)

    service_closure_wig = Service(
        name="Pose perruque Closure",
        description="Pose complète indétectable de perruque Closure.",
        duration_minutes=90,
        price=65.0,
        deposit_amount=30.0,
        deposit_is_percent=True,
        requires_wig_deposit=True,
        includes="Pose complète de la perruque Closure",
    )
    db.session.add(service_closure_wig)

    db.session.flush()

    print("Création des produits et variantes...")
    # Produit 1 : Perruque
    wig1 = Product(
        name="Perruque Lace Front - Natural Black",
        description="Perruque 100% cheveux humains naturels de qualité Remy Hair. Couleur noire naturelle, densité 150%. Facile à coiffer et teinter.",
        base_price=250.0,
        category="wig",
        image_url="https://images.unsplash.com/photo-1605497746445-97d1b0a9eaf4?q=80&w=600",
        is_featured=True,
        is_active=True,
        is_bestseller=False,
        is_new=True,
        on_sale=True,
        sale_price=220.0
    )
    db.session.add(wig1)
    db.session.flush() # pour avoir l'id de wig1

    v1 = ProductVariant(
        product_id=wig1.id,
        length="16\"",
        density="150%",
        cap_type="Lace Front",
        color="Natural Black",
        texture="Straight",
        price_modifier=0.0,
        stock=5,
        sku="WIG-LF-BLK-16"
    )
    v2 = ProductVariant(
        product_id=wig1.id,
        length="18\"",
        density="150%",
        cap_type="Lace Front",
        color="Natural Black",
        texture="Straight",
        price_modifier=30.0,
        stock=2,
        sku="WIG-LF-BLK-18"
    )
    v3 = ProductVariant(
        product_id=wig1.id,
        length="20\"",
        density="180%",
        cap_type="360 Lace",
        color="Natural Black",
        texture="Body Wave",
        price_modifier=70.0,
        stock=1,
        sku="WIG-360-BLK-20"
    )
    db.session.add_all([v1, v2, v3])

    # Produit 2 : Soin
    care1 = Product(
        name="Spray Démêlant & Hydratant",
        description="Spray hydratant à l'huile d'argan pour l'entretien quotidien de vos perruques et extensions.",
        base_price=25.0,
        category="care",
        image_url="https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=600",
        is_featured=False,
        is_active=True,
        is_bestseller=True,
        is_new=False
    )
    db.session.add(care1)
    db.session.flush()

    v4 = ProductVariant(
        product_id=care1.id,
        length=None,
        density=None,
        cap_type=None,
        color=None,
        texture=None,
        price_modifier=0.0,
        stock=12,
        sku="CARE-SPRAY-ARGAN"
    )
    db.session.add(v4)

    print("Création de rendez-vous de démonstration...")
    appt1 = Appointment(
        user_id=2,  # Marie Dupont
        service_id=service_lace_1306.id,
        scheduled_at=datetime.now() + timedelta(days=1, hours=2),  # Demain
        status="confirmed",
        deposit_paid=True,
        deposit_paid_at=datetime.utcnow() - timedelta(hours=3),
        total_price=service_lace_1306.price,
        deposit_amount=service_lace_1306.get_deposit_amount(),
        wig_deposit_received=False,
        head_size_at_booking="22 pouces",
        client_notes="J'aimerais une raie au milieu s'il vous plaît.",
        admin_notes="Client veut raie au milieu."
    )
    db.session.add(appt1)

    appt2 = Appointment(
        user_id=3,  # Sophie Martin
        service_id=pack_flipover.id,
        variant_id=pack_flipover.variants[0].id,  # 2 paquets de 16 pouces
        scheduled_at=datetime.now() + timedelta(days=2, hours=4),  # Après-demain
        status="pending",
        deposit_paid=False,
        total_price=pack_flipover.variants[0].price,
        deposit_amount=pack_flipover.get_deposit_amount(pack_flipover.variants[0].price),
        wig_deposit_received=False,
        head_size_at_booking=None,
        client_notes="Besoin d'un shampoing et séchage rapide."
    )
    db.session.add(appt2)

    print("Création de commandes de démonstration...")
    order1 = Order(
        user_id=2,  # Marie Dupont
        status="paid",
        subtotal=250.0,
        shipping_cost=8.0,
        total_amount=258.0,
        shipping_address="12 Rue de la Paix, 75002 Paris",
        payment_reference="ch_3Mv8xK2eZvKYlo2C",
        created_at=datetime.utcnow() - timedelta(days=2)
    )
    db.session.add(order1)
    db.session.flush()

    item1 = OrderItem(
        order_id=order1.id,
        product_id=wig1.id,
        variant_id=v1.id,
        quantity=1,
        unit_price=250.0
    )
    db.session.add(item1)

    db.session.commit()
    print("🎉 Base de données en développement peuplée avec succès !")
