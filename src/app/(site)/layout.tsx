import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NewsletterPopup } from "@/components/NewsletterPopup";
import { getSettings } from "@/lib/settings";

// Les pages lisent la base (réglages, catalogue) : jamais pré-générées au build.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <>
      <Header instagram={s.instagramHandle} tiktok={s.tiktokUrl} email={s.contactEmail} />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
      {s.newsletterPopupEnabled === "true" && <NewsletterPopup />}
    </>
  );
}
