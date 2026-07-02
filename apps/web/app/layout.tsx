import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://getboss.ai"),
  title: {
    default: "BOSS — Business Operating System for Small Business",
    template: "%s | BOSS",
  },
  description:
    "Meet your AI team. BOSS handles bookings, follow-ups, payments, reviews, and reporting — 24/7 — so you can focus on what you built this for.",
  keywords: [
    "small business AI",
    "business automation",
    "AI receptionist",
    "business operating system",
    "small business software",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "BOSS",
    title: "BOSS — Your Business Operating System",
    description:
      "AI team for small business. Receptionist, bookkeeper, sales helper, review manager — working 24/7.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BOSS — Your Business Operating System",
    description: "AI team for small business. Working 24/7 so you don't have to.",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
