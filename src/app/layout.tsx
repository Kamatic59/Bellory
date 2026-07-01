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
    default: "Bellory - AI Receptionist for Missed Calls",
    template: "%s | Bellory",
  },
  description: "Bellory answers missed and after-hours calls, qualifies customers, books from your real availability, and routes urgent calls to a human.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Bellory - AI Receptionist for Missed Calls",
    description: "Turn missed calls into booked jobs with a human-sounding AI receptionist for service businesses.",
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
    title: "Bellory - AI Receptionist for Missed Calls",
    description: "Bellory answers missed and after-hours calls, qualifies customers, books jobs, and routes urgent calls to a human.",
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
