import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["opsz", "SOFT", "WONK"] });
const siteUrl = new URL(process.env.NEXT_PUBLIC_APP_URL || "https://bellory.vercel.app");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Bellory - AI Receptionist for Garage Door Companies",
    template: "%s | Bellory",
  },
  description: "A done-for-you AI receptionist for garage door companies. Bellory answers missed and after-hours calls, qualifies callers, and books jobs by your rules.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Turn missed garage door calls into booked jobs.",
    description: "Private Bellory installs are opening for garage door companies. Done-for-you setup, call flow, testing, and support.",
    url: "/",
    siteName: "Bellory",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Turn missed garage door calls into booked jobs.",
    description: "Private Bellory installs are opening for garage door companies. Done-for-you setup, call flow, testing, and support.",
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
