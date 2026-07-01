import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BOSS | Business Operations",
  description: "Understand what is holding your business back and put a focused plan to work.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-body min-h-screen">{children}</body>
    </html>
  );
}
