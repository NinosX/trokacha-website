import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trokacha - La plateforme algérienne tout-en-un",
  description: "La première plateforme algérienne tout-en-un: Troc, Vente, Transport, Colis et Covoiturage",
  keywords: ["troc", "vente", "transport", "colis", "covoiturage", "algérie", "marketplace"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}
