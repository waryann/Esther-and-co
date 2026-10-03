import { Mail, MapPin, Phone } from "lucide-react";
import { InstagramIcon, TikTokIcon } from "@/components/Icons";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contact | ESTHAIR & CO.", description: "Contactez ESTHAIR & CO. sur Instagram ou par email." };

export default async function ContactPage() {
  const s = await getSettings();
  const items = [
    { icon: <InstagramIcon size={20} />, label: `@${s.instagramHandle}`, href: `https://instagram.com/${s.instagramHandle}` },
    s.tiktokUrl && { icon: <TikTokIcon size={20} />, label: "TikTok", href: s.tiktokUrl },
    s.contactEmail && { icon: <Mail size={20} strokeWidth={1.5} />, label: s.contactEmail, href: `mailto:${s.contactEmail}` },
    s.phone && { icon: <Phone size={20} strokeWidth={1.5} />, label: s.phone, href: `tel:${s.phone.replace(/\s/g, "")}` },
    s.address && { icon: <MapPin size={20} strokeWidth={1.5} />, label: s.address, href: undefined },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; href?: string }[];
  return (
    <div className="container-page max-w-md py-8 md:py-12">
      <h1 className="page-title">Contact</h1>
      <p className="mt-3 text-center text-[13px] text-[#555]">Une question ? Écrivez-nous, nous vous répondons rapidement.</p>
      <ul className="card mt-8 divide-y divide-line">
        {items.map((i) => (
          <li key={i.label}>
            {i.href ? (
              <a href={i.href} target={i.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="flex items-center gap-4 px-5 py-4 text-[14.5px] hover:bg-sand/50">{i.icon}{i.label}</a>
            ) : (
              <div className="flex items-center gap-4 px-5 py-4 text-[14.5px]">{i.icon}{i.label}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
