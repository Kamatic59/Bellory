import type { Metadata } from "next";
import { IBM_Plex_Mono, Instrument_Serif, Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const manrope = Manrope({ variable: "--font-sans", subsets: ["latin"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500", "600"] });
const instrumentSerif = Instrument_Serif({ variable: "--font-display", subsets: ["latin"], weight: "400" });
const siteUrl = new URL(process.env.NEXT_PUBLIC_APP_URL || "https://usebellory.com");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Bellory — AI Receptionist for Garage Door Companies",
    template: "%s | Bellory",
  },
  description: "A done-for-you AI receptionist for garage door companies. Bellory answers missed and after-hours calls, qualifies callers, and books jobs by your rules.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Turn missed garage door calls into booked jobs.",
    description: "Bellory answers when you can't — configured, tested, and supported for you. Free installation, no contract.",
    url: "/",
    siteName: "Bellory",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Turn missed garage door calls into booked jobs.",
    description: "Bellory answers when you can't — configured, tested, and supported for you. Free installation, no contract.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${manrope.variable} ${plexMono.variable} ${instrumentSerif.variable} antialiased`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
