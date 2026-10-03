# ESTHAIR & CO. — Site de réservation mobile-first

Système de réservation avec paiement d'acompte, back-office et contenu administrable.
Parcours : **Instagram → Accueil → Réservation → Service → Options → Date/heure → Coordonnées → Paiement acompte → Confirmation.**

## Démarrage

```bash
cd esthair-co
cp .env.example .env        # puis adapter les valeurs (déjà présent en dev)
npm install
npm run setup               # génère Prisma, crée la base SQLite, importe le catalogue
npm run dev                 # http://localhost:3000
```

- **Site** : `/` — **Admin** : `/admin` (identifiants créés au seed : `ADMIN_EMAIL` / `ADMIN_PASSWORD` du `.env`, **à changer** dans *Paramètres*).
- `npm test` : 22 tests (double réservation, verrou expiré, paiement réussi/échoué, webhook, prix, annulation, rappels, uploads).
- `npm run db:reset` : remet la base à zéro avec le catalogue des maquettes.

## Ce qui est construit (fidèle aux maquettes mobile + desktop)

| Maquette | Route |
|---|---|
| 1 Accueil · 3 Popup newsletter · 2 Menu | `/` |
| 4 Réservation (Packs / Prestations) | `/reservation` |
| 5 Nos packs · 6 Détail pack | `/packs`, `/packs/[slug]` |
| 13 Nos prestations · 14 Détail prestation | `/prestations`, `/prestations/[slug]` |
| 7 Options supplémentaires | `/reservation/options` |
| 8 Date & heure | `/reservation/date` |
| 9 Informations cliente | `/reservation/informations` |
| 10 Paiement de l'acompte (+ récapitulatif) | `/reservation/paiement/[token]` |
| 11 Dernière étape (preuve Instagram) | `/paiement/instructions/[token]` |
| 12 Confirmation | `/confirmation/[token]` |
| 15 Blog · article | `/blog`, `/blog/[slug]` |
| 16 Avis clientes (+ dépôt d'avis, photo + consentement) | `/avis` |
| À propos · FAQ · Contact | `/a-propos`, `/faq`, `/contact` |
| Gestion / modification du RDV par la cliente | `/rendez-vous/[token]` |

Back-office (`/admin`) : Dashboard + entonnoir de conversion · Calendrier jour/semaine/mois · Rendez-vous (créer, déplacer, annuler, confirmer, terminer, no-show, ajout manuel Instagram/DM) · Clients (historique, « Réserver à nouveau ») · Packs + variantes · Prestations · Options · Disponibilités (horaires, jours exceptionnels, créneaux bloqués) · Paiements · Avis (modération) · Blog · FAQ · Newsletter (export CSV) · Paramètres.

## Principes techniques

- **Le backend est la source de vérité.** Le frontend n'envoie que des identifiants (pack, variante, options, date, heure). Prix, durée, acompte, disponibilité et statuts sont recalculés côté serveur (`src/lib/pricing.ts`, `booking.ts`, `availability.ts`).
- **Disponibilités calculées**, jamais saisies : horaires − rendez-vous − créneaux bloqués. Un RDV de 180 min à 10:00 bloque tous les départs qui le chevauchent.
- **Pas de double réservation** : vérification du chevauchement *dans la transaction* de création. Testé avec deux requêtes simultanées.
- **Verrou temporaire** (réglage `lockMinutes`, 10 min par défaut) dès l'arrivée au paiement ; expiration automatique → créneau libéré.
- **Paiement confirmé uniquement par webhook signé** (`/api/webhooks/payment`, HMAC-SHA256 ; `/api/webhooks/stripe`, signature Stripe vérifiée). Le retour navigateur ne confirme rien. Idempotent. Si le verrou a expiré et que le créneau est repris, la réservation passe en `CONFLICT` et le paiement est marqué « à rembourser » (alerte au dashboard).
- Le bouton **« J'ai envoyé mon paiement »** enregistre uniquement `paymentScreenshotSent = true`.
- **Revalidation avant paiement** : si un prix/option/service change entre-temps, le nouveau récapitulatif est affiché et une confirmation est demandée.
- **Tout est dynamique** (services, packs, variantes, prix, options, durées, photos, horaires, avis, FAQ, articles, textes de la page À propos, coordonnées…) et modifiable depuis l'admin.
- **Sécurité** : session admin JWT httpOnly + middleware + `requireAdmin()` dans chaque page/action, mots de passe bcrypt, limitation des tentatives de connexion, limitation de débit (checkout/newsletter/avis), validation Zod, uploads validés par le contenu réel (JPG/PNG/WEBP, 6 Mo, redimensionnés et convertis en WebP), en-têtes de sécurité.

## Paiement

`PAYMENT_PROVIDER=mock` (défaut) : page de démonstration `/pay/mock/...` qui appelle le webhook signé comme un vrai prestataire (réussite / échec).
`PAYMENT_PROVIDER=stripe` : renseigner `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET`, pointer le webhook Stripe vers `/api/webhooks/stripe` (événements `checkout.session.completed`, `…async_payment_succeeded/failed`, `…expired`). **L'adaptateur Stripe est écrit mais n'a pas été testé avec un vrai compte** : à valider en mode test avant la mise en ligne. Le prestataire définitif reste à choisir.

## Emails & rappels

- Sans `SMTP_*`, les emails sont **journalisés** (table `EmailLog`, visible dans *Paramètres*). Avec SMTP configuré, ils sont envoyés.
- Rappels (48 h / 24 h, configurables) : appeler régulièrement `GET /api/cron/reminders` avec `Authorization: Bearer $CRON_SECRET` (ex. toutes les 15 min via un cron / Vercel Cron / GitHub Actions). Cet appel libère aussi les verrous expirés.

## Mise en production (à prévoir)

- Passer `provider = "postgresql"` dans `prisma/schema.prisma` + `DATABASE_URL` (SQLite convient pour développer, pas pour plusieurs instances). Avec PostgreSQL, ajouter si souhaité une contrainte d'exclusion sur les créneaux en plus du contrôle transactionnel actuel.
- HTTPS, `AUTH_SECRET` long et aléatoire, `PAYMENT_WEBHOOK_SECRET`, `CRON_SECRET`, `SITE_URL` réel.
- Stockage des uploads : dossier `UPLOAD_DIR` (volume persistant) ou stockage objet (S3/R2).
- Sauvegardes quotidiennes de la base. Limiteur de débit en mémoire → Redis si plusieurs instances.
- Analytics : événements first-party (`AnalyticsEvent`, funnel dans le dashboard). Brancher GA4/Plausible si souhaité.

## Documentation

`docs/ARCHITECTURE.md` : architecture, schéma de base de données, user flow, états des réservations.
`docs/DEPLOY.md` : mise en ligne sur Render (remplacement de l'ancien site).
