import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { InstagramIcon } from "@/components/Icons";
import { ScreenshotButton } from "@/components/InstructionsActions";
import { getBookingByToken } from "@/lib/booking-view";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Une dernière étape | ESTHAIR & CO.", robots: { index: false } };

export default async function InstructionsPage({ params }: { params: { token: string } }) {
  const b = await getBookingByToken(params.token);
  if (!b) redirect("/reservation");
  if (b.status !== "CONFIRMED" && b.status !== "COMPLETED") redirect(`/paiement/retour/${params.token}`);
  const s = await getSettings();

  return (
    <div className="container-page max-w-md py-12 text-center">
      <span className="mx-auto flex h-14 w-14 animate-check-pop items-center justify-center rounded-full bg-tan/80 text-white"><Check size={26} /></span>
      <h1 className="h-display mt-5 text-[32px]">Une dernière étape !</h1>
      <p className="mt-3 text-[13.5px] text-[#444]">Merci pour votre paiement.</p>
      <p className="mx-auto mt-2 max-w-xs text-[13.5px] leading-relaxed text-[#444]">
        Après avoir effectué votre paiement, merci d&apos;envoyer un screenshot de la preuve de paiement à notre Instagram.
      </p>

      <a
        href={`https://instagram.com/${s.instagramHandle}`}
        target="_blank"
        rel="noreferrer"
        className="mt-6 flex flex-col items-center gap-2 bg-sand px-5 py-6 text-[#c13584]"
      >
        <InstagramIcon size={28} />
        <span className="font-serif text-[22px] text-ink">@{s.instagramHandle}</span>
      </a>
      <p className="mt-4 bg-sand px-5 py-5 text-[13px] text-[#444]">Cela nous permet de confirmer votre réservation plus rapidement.</p>

      <div className="mt-6"><ScreenshotButton token={params.token} /></div>
    </div>
  );
}
