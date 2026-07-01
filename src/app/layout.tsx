import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const siteUrl = new URL(process.env.NEXT_PUBLIC_APP_URL || "https://bellory.vercel.app");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Bellory - AI Receptionist for Garage Door Companies",
    template: "%s | Bellory",
  },
  description: "Bellory is a done-for-you AI receptionist for garage door companies. We help catch missed and after-hours calls, qualify customers, book jobs, and transfer urgent calls based on your rules.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Turn missed garage door calls into booked jobs.",
    description: "Private Bellory installs are opening for garage door companies. Done-for-you setup, call flow, testing, and support.",
    url: "/",
    siteName: "Bellory",
    images: [
      {
        url: "/brand/bellory-logo.png",
        width: 1536,
        height: 1086,
        alt: "Bellory AI receptionist",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Turn missed garage door calls into booked jobs.",
    description: "Private Bellory installs are opening for garage door companies. Done-for-you setup, call flow, testing, and support.",
    images: ["/brand/bellory-logo.png"],
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
