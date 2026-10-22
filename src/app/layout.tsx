import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SmartphoneFrame } from "@/components/SmartphoneFrame";

export const metadata: Metadata = {
  title: "COLPO BASSO: Faida di Semi — Party Game",
  description:
    "Il party game di carte da bere a 4 fazioni. Attacchi al neon, contrattacchi in 7 secondi, spionaggio e cascate d'Asso.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Colpo Basso",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#05020a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="it"
      className="dark h-full antialiased bg-[#05020a] text-slate-100 selection:bg-rose-500 selection:text-white"
    >
      <body className="min-h-full font-sans bg-[#05020a] text-slate-100 overflow-x-hidden">
        <SmartphoneFrame>{children}</SmartphoneFrame>
      </body>
    </html>
  );
}
