import os
import sys
from datetime import datetime, timedelta

# Ajouter le chemin parent au PYTHONPATH pour pouvoir importer backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app import create_app
from backend.extensions import db
from backend.models import User, Product, ProductVariant, Service, Appointment, Order, OrderItem

app = create_app("development")

with app.app_context():
    print("Re-création des tables de la base de données...")
    db.drop_all()
    db.create_all()

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
    service1 = Service(
        name="Pose Perruque Lace Front",
        description="Pose complète indétectable de perruque Lace Front avec collage et customisation.",
        duration_minutes=120,
        price=80.0,
        deposit_amount=24.0,  # 30%
        requires_wig_deposit=True
    )
    db.session.add(service1)

    service2 = Service(
        name="Pose Perruque 360",
        description="Pose de perruque 360 permettant de faire des queues de cheval hautes indétectables.",
        duration_minutes=150,
        price=100.0,
        deposit_amount=30.0,  # 30%
        requires_wig_deposit=True
    )
    db.session.add(service2)

    service3 = Service(
        name="Entretien & Soin",
        description="Shampoing, soin profond, et coiffage de votre perruque.",
        duration_minutes=60,
        price=40.0,
        deposit_amount=12.0,  # 30%
        requires_wig_deposit=False
    )
    db.session.add(service3)

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
        service_id=1,  # Pose Lace Front
        scheduled_at=datetime.now() + timedelta(days=1, hours=2),  # Demain
        status="confirmed",
        deposit_paid=True,
        deposit_paid_at=datetime.utcnow() - timedelta(hours=3),
        wig_deposit_received=False,
        head_size_at_booking="22 pouces",
        client_notes="J'aimerais une raie au milieu s'il vous plaît.",
        admin_notes="Client veut raie au milieu."
    )
    db.session.add(appt1)

    appt2 = Appointment(
        user_id=3,  # Sophie Martin
        service_id=3,  # Entretien
        scheduled_at=datetime.now() + timedelta(days=2, hours=4),  # Après-demain
        status="pending",
        deposit_paid=False,
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
