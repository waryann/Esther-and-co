import { db } from "@/lib/db";
import { changePassword, saveSettings } from "@/app/admin/actions";
import { getSettings } from "@/lib/settings";
import { Card, Check, Field, Flash, ImageField, PageHead, Submit, Table, TextArea } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

function Section({ title, section, children }: { title: string; section: string; children: React.ReactNode }) {
  return (
    <Card title={title}>
      <form action={saveSettings} encType="multipart/form-data" className="space-y-3">
        <input type="hidden" name="section" value={section} />
        {children}
        <Submit>Enregistrer</Submit>
      </form>
    </Card>
  );
}

export default async function SettingsAdmin({ searchParams }: { searchParams: { msg?: string; error?: string } }) {
  const s = await getSettings();
  const emails = await db.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 15 });
  return (
    <>
      <PageHead title="Paramètres" sub="Tout ce qui peut changer avec le temps est modifiable ici, sans toucher au code." />
      <Flash msg={searchParams.msg} error={searchParams.error} />
      <div className="grid gap-5 xl:grid-cols-2">
        <Section title="Réservation" section="booking">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fuseau horaire" name="timezone" defaultValue={s.timezone} hint="Ex. Europe/Brussels" />
            <Field label="Intervalle entre créneaux (min)" name="slotIntervalMinutes" type="number" defaultValue={s.slotIntervalMinutes} />
            <Field label="Durée du verrou de créneau (min)" name="lockMinutes" type="number" defaultValue={s.lockMinutes} hint="Pendant le paiement" />
            <Field label="Réservation possible jusqu'à (jours)" name="maxDaysAhead" type="number" defaultValue={s.maxDaysAhead} />
            <Field label="Préavis minimum (heures)" name="minNoticeHours" type="number" defaultValue={s.minNoticeHours} />
            <Field label="Rappels (heures avant, séparées par des virgules)" name="reminderHours" defaultValue={s.reminderHours} hint="Ex. 48,24" />
          </div>
        </Section>

        <Section title="Politique d'annulation (règles à définir par l'entreprise)" section="policy">
          <Field label="Délai d'annulation / modification en ligne (heures avant le RDV)" name="cancellationDeadlineHours" type="number" defaultValue={s.cancellationDeadlineHours} hint="Vide = les clientes doivent vous contacter (aucune règle inventée)" />
          <TextArea label="Politique de remboursement de l'acompte" name="depositRefundPolicy" defaultValue={s.depositRefundPolicy} rows={3} />
          <TextArea label="Politique de déplacement" name="reschedulePolicy" defaultValue={s.reschedulePolicy} rows={3} />
          <TextArea label="Politique de réservation (ajoutée à l'email de confirmation)" name="bookingPolicy" defaultValue={s.bookingPolicy} rows={3} />
        </Section>

        <Section title="Coordonnées" section="contact">
          <Field label="Adresse" name="address" defaultValue={s.address} hint="Affichée sur la confirmation et dans les emails" />
          <Field label="Email de contact" name="contactEmail" type="email" defaultValue={s.contactEmail} />
          <Field label="Téléphone" name="phone" defaultValue={s.phone} />
          <Field label="Instagram (sans @)" name="instagramHandle" defaultValue={s.instagramHandle} />
          <Field label="Lien TikTok" name="tiktokUrl" defaultValue={s.tiktokUrl} />
        </Section>

        <Section title="Page d'accueil & newsletter" section="general">
          <Field label="Slogan" name="tagline" defaultValue={s.tagline} />
          <Field label="Vidéos d'accueil (chemins séparés par des virgules, lues à la suite)" name="heroVideo" defaultValue={s.heroVideo} hint="Fichiers dans public/media/ (ex. /media/accueil-1.mp4,/media/accueil-2.mp4). Vide = photo uniquement." />
          <ImageField label="Photo d'accueil (affichée avant le chargement de la vidéo / si pas de vidéo)" name="heroImage" current={s.heroImage} />
          <ImageField label="Photo — carte « Nos packs » (page Réservation)" name="reservationPacksImage" current={s.reservationPacksImage} />
          <ImageField label="Photo — carte « Nos prestations » (page Réservation)" name="reservationServicesImage" current={s.reservationServicesImage} />
          <TextArea label="Pastilles (une par ligne : texte|icône — badge, globe, star, heart)" name="homeBadges" defaultValue={s.homeBadges} rows={4} />
          <Check label="Afficher le popup newsletter à la première visite" name="newsletterPopupEnabled" defaultChecked={s.newsletterPopupEnabled === "true"} />
        </Section>

        <Section title="Page À propos" section="about">
          <Field label="Petit titre (en doré)" name="aboutEyebrow" defaultValue={s.aboutEyebrow} />
          <Field label="Grand titre" name="aboutTitle" defaultValue={s.aboutTitle} />
          <ImageField label="Photo" name="aboutImage" current={s.aboutImage} />
          <TextArea label="Texte" name="aboutIntro" defaultValue={s.aboutIntro} rows={12} hint="Paragraphes séparés par une ligne vide" />
          <TextArea label="Phrase finale (en doré)" name="aboutClosing" defaultValue={s.aboutClosing} rows={2} />
          <TextArea label="Section supplémentaire « Mon histoire » (facultatif)" name="aboutStory" defaultValue={s.aboutStory} rows={4} />
          <TextArea label="Section supplémentaire « Ma philosophie » (facultatif)" name="aboutPhilosophy" defaultValue={s.aboutPhilosophy} rows={4} />
        </Section>

        <Card title="Mot de passe admin">
          <form action={changePassword} className="space-y-3">
            <Field label="Mot de passe actuel" name="current" type="password" required />
            <Field label="Nouveau mot de passe (10 caractères min.)" name="next" type="password" required />
            <Submit>Changer le mot de passe</Submit>
          </form>
        </Card>
      </div>

      <h2 className="mb-3 mt-8 text-[12px] font-semibold uppercase tracking-[0.14em] text-taupe">Journal des emails (15 derniers)</h2>
      <Table head={["Date", "Destinataire", "Objet", "Statut"]} empty={emails.length ? undefined : "Aucun email envoyé."}>
        {emails.map((e) => (
          <tr key={e.id}>
            <td className="whitespace-nowrap px-4 py-3">{e.createdAt.toLocaleString("fr-BE")}</td>
            <td className="px-4 py-3">{e.to}</td>
            <td className="px-4 py-3">{e.subject}</td>
            <td className="px-4 py-3 text-[12px]">{e.status === "LOGGED" ? "Journalisé (SMTP non configuré)" : e.status}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
