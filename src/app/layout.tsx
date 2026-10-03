import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { BookingProvider } from "@/components/BookingProvider";

const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-serif", display: "swap" });
const sans = Jost({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: { default: "ESTHAIR & CO. — Hair. Beauty. Confidence.", template: "%s" },
  description: "Réservez votre rendez-vous chez ESTHAIR & CO. : packs et prestations, paiement de l'acompte en ligne.",
  openGraph: { siteName: "ESTHAIR & CO.", type: "website", locale: "fr_BE" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#FBF7F1" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <BookingProvider>{children}</BookingProvider>
      </body>
    </html>
  );
}
