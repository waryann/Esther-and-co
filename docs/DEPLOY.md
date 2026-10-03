# Mise en ligne sur Render (remplace l'ancien site `esther-and-co.onrender.com`)

> Rien dans ce dépôt ne touche à la production tant que vous n'avez pas fait les étapes 3 à 5 vous-même dans Render / GitHub.
> L'ancien site (dépôt `waryann/Esther-and-co`, Flask + React) n'est **pas modifié** : il sert de retour en arrière.

## 0. À régler AVANT de basculer (sinon le site ne doit pas encaisser de vraies clientes)

- [ ] **Stripe** : l'adaptateur n'a jamais été testé avec un vrai compte. Tester d'abord avec les clés *test* de Stripe (carte `4242 4242 4242 4242`), vérifier que le webhook confirme bien la réservation, puis passer aux clés *live*.
- [ ] **Emails** : renseigner `SMTP_*` (sinon aucun email de confirmation/rappel n'est envoyé). Pas de domaine → utiliser un service d'envoi qui accepte une adresse Gmail/Outlook, ou un fournisseur type Brevo/Resend.
- [ ] **Admin → Paramètres** : adresse du salon, horaires réels, durées des prestations, politique d'annulation, coordonnées.
- [ ] `ADMIN_PASSWORD` fort (≥ 10 caractères) : le site refuse de démarrer avec le mot de passe d'exemple.
- [ ] En production, le **paiement de démonstration est bloqué** (volontairement). Il faut `PAYMENT_PROVIDER=stripe`.

## 1. Sauvegarder l'ancien site (ne rien supprimer à cette étape)

Dans Render → votre base PostgreSQL actuelle → **Backups / Export** (ou en ligne de commande :
`pg_dump "<External Database URL>" > ancien-site.sql`). Gardez aussi une copie des variables d'environnement de l'ancien service (Stripe, Twilio, Cloudinary…).
**Ne supprimez pas l'ancienne base** : conservez-la tant que vous n'êtes pas sûre de ne plus en avoir besoin.

## 2. Mettre le code du nouveau site sur GitHub (nouveau dépôt, pas l'ancien)

```bash
cd /Users/russell/Desktop/DEV-Esther/esthair-co
git init -b main && git add -A && git commit -m "ESTHAIR & CO. — nouveau site"
git remote add origin https://github.com/<votre-compte>/esthair-co.git   # dépôt créé vide sur github.com
git push -u origin main
```
(`.env` et la base locale sont ignorés par git.)

## 3. Libérer l'adresse `esther-and-co.onrender.com`

Le sous-domaine `onrender.com` est lié au service Render, et un service Python ne peut pas devenir un service Node. Donc : Render → ancien service web → **Settings → Delete Web Service** (la base de données reste). Le nom `esther-and-co` redevient disponible ; s'il ne l'est pas tout de suite, Render proposera `esther-and-co-xxxx` (il faudra alors utiliser cette adresse ou attendre).
*Entre cette étape et la suivante, le site est indisponible : faites-les à la suite, hors heures de réservation.*

## 4. Créer le nouveau service

Render → **New → Blueprint** → choisir le dépôt `esthair-co` (fichier `render.yaml` : service web + base PostgreSQL + tâche de rappels).
Renseigner les variables demandées : `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SMTP_*`, `EMAIL_FROM`. Les secrets `AUTH_SECRET`, `PAYMENT_WEBHOOK_SECRET`, `CRON_SECRET` sont générés automatiquement.
Si l'adresse obtenue n'est pas `https://esther-and-co.onrender.com`, corriger `SITE_URL` (service web **et** tâche de rappels).

Le premier démarrage crée les tables et importe le catalogue (idempotent).

## 5. Stripe

Dashboard Stripe → Développeurs → Webhooks → ajouter `https://<votre-adresse>/api/webhooks/stripe`, événements :
`checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`. Copier la clé `whsec_…` dans `STRIPE_WEBHOOK_SECRET`.

## 6. Vérifications après mise en ligne

1. `/` s'affiche (vidéos, menu), `/admin` demande la connexion.
2. Réservation complète en mode **test** Stripe → réservation `CONFIRMED`, email reçu, créneau bloqué dans le calendrier admin.
3. Paiement échoué → message d'erreur, créneau relâché après 10 min.
4. Photo téléversée dans l'admin → toujours visible après un redéploiement (disque `/var/data`).
5. Passer Stripe en clés *live* seulement ensuite.

## Retour en arrière

Recréer un service web depuis `github.com/waryann/Esther-and-co` avec ses anciennes variables d'environnement et l'ancienne base (conservée à l'étape 1).

## Coûts (indicatifs, à vérifier sur render.com — je n'ai pas pu consulter les tarifs actuels)

Service web *Starter* + base PostgreSQL + disque 1 Go + tâche cron : de l'ordre d'une quinzaine d'euros/dollars par mois au total. Le plan gratuit n'est **pas adapté** : le service s'endort après inactivité (première visite très lente) et la base gratuite est supprimée au bout de 30 jours.
