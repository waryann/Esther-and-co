import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const FLIPOVER_VARIANTS = [
  { label: '2 paquets 16"', bundles: 2, length: 16, price: 200 },
  { label: '3 paquets 16"', bundles: 3, length: 16, price: 265 },
  { label: '3 paquets 18"', bundles: 3, length: 18, price: 325 },
  { label: '3 paquets 20"', bundles: 3, length: 20, price: 330 },
];

const PACK_FEATURES = "Mèches incluses|Prestation incluse|Rendu naturel|Pose rapide";

async function main() {
  // ── Admin ──
  // En production, on ne crée un admin que si ADMIN_EMAIL / ADMIN_PASSWORD sont fournis et valides.
  // Si un admin existe déjà (redémarrage, redéploiement), ces variables ne sont plus nécessaires.
  const email = (process.env.ADMIN_EMAIL || "admin@esthairandco.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "ChangeMe-2024!";
  const prod = process.env.NODE_ENV === "production";
  const credsOk = !!process.env.ADMIN_EMAIL && !!process.env.ADMIN_PASSWORD && password !== "ChangeMe-2024!" && password.length >= 10;
  if (!prod || credsOk) {
    await db.user.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash: await bcrypt.hash(password, 12), name: "Esther" },
    });
  } else if ((await db.user.count()) === 0) {
    throw new Error("Aucun compte admin : définissez ADMIN_EMAIL et ADMIN_PASSWORD (10 caractères min., différent de la valeur d'exemple).");
  }

  // ── Packs ──
  // Durées : valeurs provisoires (exemples du cahier des charges), modifiables depuis l'admin.
  const flipover = await db.package.upsert({
    where: { slug: "flipover" },
    update: {},
    create: {
      name: "Pack Flipover",
      slug: "flipover",
      shortDescription: "Mèches + prestation incluses",
      description:
        "Le pack Flipover est la solution idéale pour un rendu naturel, rapide et sans colle. Les mèches ainsi que la prestation sont incluses dans le prix final.",
      basePrice: 200,
      depositAmount: 50,
      durationMinutes: 180,
      features: PACK_FEATURES,
      sortOrder: 1,
      seoTitle: "Pack Flipover — Mèches + prestation | ESTHAIR & CO.",
      seoDescription: "Pack Flipover à partir de 200€ : mèches et prestation incluses. Réservez en ligne chez ESTHAIR & CO.",
    },
  });
  if ((await db.packageVariant.count({ where: { packageId: flipover.id } })) === 0) {
    await db.packageVariant.createMany({
      data: FLIPOVER_VARIANTS.map((v, i) => ({ ...v, packageId: flipover.id, sortOrder: i })),
    });
  }

  await db.package.upsert({
    where: { slug: "tissage-balayage" },
    update: {},
    create: {
      name: "Pack Tissage Balayage",
      slug: "tissage-balayage",
      shortDescription: "Mèches + prestation incluses",
      description:
        "Le pack Tissage Balayage allie mèches et prestation pour un résultat naturel et lumineux. Tout est inclus dans le prix final.",
      basePrice: 400,
      depositAmount: 50,
      durationMinutes: 240,
      features: PACK_FEATURES,
      sortOrder: 2,
      seoTitle: "Pack Tissage Balayage — 400€ | ESTHAIR & CO.",
      seoDescription: "Pack Tissage Balayage à 400€ : mèches et prestation incluses. Réservez en ligne chez ESTHAIR & CO.",
    },
  });

  await db.package.upsert({
    where: { slug: "tissage-closure" },
    update: {},
    create: {
      name: "Pack Tissage Closure 2x6",
      slug: "tissage-closure",
      shortDescription: "Mèches + prestation incluses",
      description:
        "Le pack Tissage Closure 2x6 comprend les mèches et la prestation pour un rendu soigné et naturel. Tout est inclus dans le prix final.",
      basePrice: 350,
      depositAmount: 50,
      durationMinutes: 240,
      features: PACK_FEATURES,
      sortOrder: 3,
      seoTitle: "Pack Tissage Closure 2x6 — 350€ | ESTHAIR & CO.",
      seoDescription: "Pack Tissage Closure 2x6 à 350€ : mèches et prestation incluses. Réservez en ligne chez ESTHAIR & CO.",
    },
  });

  // Photos fournies (public/images) : appliquées uniquement si le pack n'a pas encore de photo.
  for (const slug of ["flipover", "tissage-balayage", "tissage-closure"]) {
    await db.package.updateMany({ where: { slug, image: "" }, data: { image: `/images/pack-${slug}.webp` } });
  }

  // ── Prestations individuelles ──
  const SVC_FEATURES = "Pose incluse|Rendu naturel|Tient longtemps|Possibilité de personnalisation";
  const services = [
    { name: "Pose perruque", slug: "pose-perruque", price: 80, duration: 90, desc: "Une pose de perruque soignée pour un rendu naturel et confortable." },
    { name: "Pose perruque closure", slug: "pose-perruque-closure", price: 90, duration: 120, desc: "Pose de perruque avec closure pour une finition naturelle au niveau de la raie." },
    { name: "Tissage ouvert", slug: "tissage-ouvert", price: 120, duration: 180, desc: "Un tissage ouvert réalisé avec soin pour un rendu fluide et naturel." },
    { name: "Flipover", slug: "flipover", price: 80, duration: 120, desc: "La technique flipover, rapide et sans colle, pour un rendu naturel." },
    { name: "Pony lace", slug: "pony-lace", price: 100, duration: 120, desc: "Une queue-de-cheval ultra naturelle avec une finition soignée." },
  ];
  for (const [i, s] of services.entries()) {
    await db.service.upsert({
      where: { slug: s.slug },
      update: {},
      create: {
        name: s.name,
        slug: s.slug,
        shortDescription: "",
        description: s.desc,
        price: s.price,
        depositAmount: 20,
        durationMinutes: s.duration,
        features: SVC_FEATURES,
        sortOrder: i + 1,
        seoTitle: `${s.name} à partir de ${s.price}€ | ESTHAIR & CO.`,
        seoDescription: `${s.desc} Réservez en ligne chez ESTHAIR & CO.`,
      },
    });
  }

  // Photos des prestations (public/images) : appliquées uniquement si la prestation n'a pas encore de photo.
  for (const slug of ["pose-perruque", "flipover", "pony-lace", "pose-perruque-closure", "tissage-ouvert"]) {
    await db.service.updateMany({ where: { slug, image: "" }, data: { image: `/images/prestation-${slug}.webp` } });
  }

  // « Tissage ouvert et flipover » retiré du catalogue (supprimé s'il n'a jamais été réservé, sinon désactivé).
  await db.service.updateMany({ where: { slug: "tissage-ouvert-flipover" }, data: { active: false } });
  await db.service.deleteMany({ where: { slug: "tissage-ouvert-flipover", bookings: { none: {} } } });

  // ── Options (prix de la maquette, modifiables) ──
  const options = [
    { name: "Coloration", description: "Ajouter une coloration", price: 50, icon: "droplet" },
    { name: "Coupe", description: "Rafraîchir les pointes", price: 20, icon: "scissors" },
    { name: "Wavy / boucles", description: "Mise en forme (wavy ou boucles)", price: 20, icon: "waves" },
    { name: "Soin profond", description: "Soin hydratant et nourrissant", price: 20, icon: "heart" },
    { name: "Baby hair", description: "Réalisation de baby hair", price: 10, icon: "sparkles" },
  ];
  if ((await db.serviceOption.count()) === 0) {
    await db.serviceOption.createMany({
      data: options.map((o, i) => ({
        name: o.name,
        description: o.description,
        priceModifier: o.price,
        icon: o.icon,
        scope: "PACKAGE",
        sortOrder: i + 1,
      })),
    });
  }

  // ── Horaires (09:00–18:00, lundi→samedi ; modifiables) ──
  for (let d = 0; d < 7; d++) {
    await db.openingHour.upsert({
      where: { weekday: d },
      update: {},
      create: { weekday: d, closed: d === 0, startMin: 540, endMin: 1080 },
    });
  }

  // ── FAQ ──
  if ((await db.faqItem.count()) === 0) {
    await db.faqItem.createMany({
      data: [
        { question: "Les mèches sont-elles incluses ?", answer: "Oui, pour les packs indiqués, les mèches et la prestation sont incluses dans le prix du pack. Pour les prestations individuelles, seul le service est facturé." },
        { question: "Comment fonctionne l'acompte ?", answer: "L'acompte permet de confirmer votre rendez-vous : 50 € pour un pack, 20 € pour une prestation. Le solde est à régler sur place le jour de la prestation." },
        { question: "Comment mon rendez-vous est-il confirmé ?", answer: "Votre rendez-vous est confirmé dès que le paiement de l'acompte est validé. Vous recevez alors un email de confirmation avec tous les détails." },
        { question: "Pourquoi dois-je envoyer une preuve de paiement sur Instagram ?", answer: "Après votre paiement, merci d'envoyer une capture d'écran de votre preuve de paiement à @esthairandco sur Instagram. Cela nous permet de garder une trace de votre paiement et de confirmer votre réservation plus rapidement." },
        { question: "Puis-je ajouter une coloration ou d'autres options ?", answer: "Oui, lors de la réservation d'un pack vous pouvez personnaliser votre prestation avec des options (coloration, coupe, wavy / boucles, soin profond, baby hair). Le prix se met à jour automatiquement." },
      ].map((f, i) => ({ ...f, sortOrder: i + 1 })),
    });
  }

  // ── Blog ──
  const cats = ["Entretien", "Textures", "Extensions", "Conseils", "Produits", "Coiffure"];
  const catMap: Record<string, string> = {};
  for (const name of cats) {
    const slug = name.toLowerCase();
    const c = await db.blogCategory.upsert({ where: { slug }, update: {}, create: { name, slug } });
    catMap[name] = c.id;
  }
  const posts = [
    {
      title: "Les meilleurs produits pour entretenir votre flipover",
      slug: "meilleurs-produits-entretenir-flipover",
      cat: "Produits",
      excerpt: "Shampoing, soin, huile : les essentiels pour garder un flipover doux et naturel.",
      cta: ["Vous êtes prête ?", "RÉSERVER MON FLIPOVER", "/packs/flipover"],
      content:
        "Un flipover bien entretenu garde son aspect naturel plus longtemps. Voici les produits essentiels à avoir chez vous.\n\n## Un shampoing doux\nPrivilégiez un shampoing sans sulfates, utilisé avec parcimonie, en massant délicatement le cuir chevelu sans frotter les longueurs.\n\n## Un soin hydratant\nAppliquez un après-shampoing ou un masque sur les longueurs, en évitant la zone de pose. Rincez soigneusement.\n\n## Une huile ou un sérum léger\nQuelques gouttes sur les pointes suffisent pour limiter les frisottis et garder de la brillance.\n\n## Une brosse adaptée\nUtilisez une brosse à poils souples ou un peigne à dents larges, en commençant toujours par les pointes.",
    },
    {
      title: "Quelle texture choisir selon votre type de cheveux ?",
      slug: "quelle-texture-choisir",
      cat: "Textures",
      excerpt: "Straight, body wave, curly : comment trouver la texture qui se fond avec vos cheveux.",
      cta: ["Besoin d'un conseil ?", "JE BOOK MA PLACE", "/reservation"],
      content:
        "Le choix de la texture dépend de votre type de cheveux, de votre style et de l'effet recherché.\n\n## Straight\nUn rendu lisse et net, qui s'accorde bien avec des cheveux lissés.\n\n## Body wave\nDes ondulations souples, très polyvalentes, qui apportent du volume tout en restant naturelles.\n\n## Boucles\nPour un rendu plus marqué, choisissez une texture proche de la vôtre afin que la fusion soit la plus naturelle possible.\n\nN'hésitez pas à nous poser la question lors de votre réservation.",
    },
    {
      title: "Comment dormir avec son tissage ?",
      slug: "comment-dormir-avec-son-tissage",
      cat: "Entretien",
      excerpt: "Nos conseils simples pour protéger votre tissage pendant la nuit.",
      cta: ["Vous êtes prête ?", "RÉSERVER MON TISSAGE", "/reservation"],
      content:
        "Bien protéger son tissage la nuit permet de garder une pose propre plus longtemps.\n\n## Attachez vos cheveux\nUne tresse lâche ou une queue-de-cheval basse limite les frottements.\n\n## Utilisez du satin\nUn bonnet ou une taie d'oreiller en satin réduit les frisottis et les nœuds.\n\n## Évitez de dormir les cheveux mouillés\nLaissez toujours sécher complètement avant de vous coucher.",
    },
    {
      title: "Combien de mèches prendre ?",
      slug: "combien-de-meches-prendre",
      cat: "Extensions",
      excerpt: "2 ou 3 paquets, 16, 18 ou 20 pouces : comment choisir la bonne quantité.",
      cta: ["Choisissez votre pack", "VOIR NOS PACKS", "/packs"],
      content:
        "Le nombre de paquets dépend de la longueur souhaitée et du volume recherché.\n\n## Plus c'est long, plus il en faut\nUne longueur plus importante demande généralement plus de volume pour garder un rendu équilibré.\n\n## Nos variantes\nPour le pack Flipover, choisissez entre 2 ou 3 paquets, en 16, 18 ou 20 pouces.\n\nEn cas de doute, demandez-nous conseil.",
    },
    {
      title: "Comment entretenir son Flipover ?",
      slug: "comment-entretenir-son-flipover",
      cat: "Entretien",
      excerpt: "Les bons gestes au quotidien pour un flipover qui tient longtemps.",
      cta: ["Vous êtes prête ?", "RÉSERVER MON FLIPOVER", "/packs/flipover"],
      content:
        "Quelques gestes simples suffisent pour garder un flipover impeccable.\n\n## Démêlez en douceur\nCommencez par les pointes et remontez progressivement.\n\n## Hydratez régulièrement\nUn soin léger sur les longueurs maintient la souplesse des mèches.\n\n## Lavez avec modération\nUn lavage doux, sans frotter, suffit.",
    },
    {
      title: "Straight ou Body Wave ?",
      slug: "straight-ou-body-wave",
      cat: "Textures",
      excerpt: "Deux textures populaires, deux rendus très différents.",
      cta: ["", "", ""],
      content:
        "Straight et body wave sont deux choix très demandés.\n\n## Straight\nUn rendu lisse, élégant et facile à coiffer.\n\n## Body wave\nUn effet ondulé plus décontracté, qui donne du volume.\n\nLe bon choix dépend de votre style et de l'entretien que vous souhaitez.",
    },
    {
      title: "Comment entretenir ses boucles ?",
      slug: "comment-entretenir-ses-boucles",
      cat: "Entretien",
      excerpt: "Hydratation, démêlage, protection : le trio gagnant pour des boucles définies.",
      cta: ["", "", ""],
      content:
        "Des boucles bien entretenues restent définies et souples.\n\n## Hydratez\nUn produit sans rinçage aide à garder la définition.\n\n## Démêlez délicatement\nPassez les doigts ou un peigne à dents larges, du bas vers le haut.\n\n## Protégez la nuit\nUn bonnet ou une taie en satin limite les frisottis.",
    },
  ];
  for (const [i, p] of posts.entries()) {
    await db.blogPost.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        content: p.content,
        categoryId: catMap[p.cat],
        status: "PUBLISHED",
        author: "Esther",
        ctaLabel: p.cta[1],
        ctaHref: p.cta[2],
        publishedAt: new Date(Date.now() - i * 86400_000 * 3),
      },
    });
  }

  // ── Avis de démonstration (textes des maquettes) ──
  if ((await db.review.count()) === 0) {
    await db.review.createMany({
      data: [
        { firstName: "Amina", rating: 5, comment: "Prestation au top ! Les mèches sont incroyables et l'accueil toujours parfait.", status: "APPROVED" },
        { firstName: "Chloé", rating: 5, comment: "Je suis trop contente de mon flipover ! Le rendu est naturel et la qualité des mèches est vraiment top.", status: "APPROVED" },
        { firstName: "Leïla", rating: 5, comment: "Meilleure coiffeuse ! Toujours satisfaite, ça fait des années que je viens.", status: "APPROVED" },
        { firstName: "Sarah", rating: 5, comment: "Un service de qualité, des mèches magnifiques et une expérience toujours agréable.", status: "APPROVED" },
      ],
    });
  }

  // ── Réglages par défaut ──
  await db.setting.upsert({ where: { key: "bookingCounter" }, update: {}, create: { key: "bookingCounter", value: "1000" } });

  console.log(`Seed OK — admin : ${email}`);
}

main().finally(() => db.$disconnect());
