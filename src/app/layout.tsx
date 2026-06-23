import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import SiteCredit from "@/components/SiteCredit";
import "./globals.css";

export const metadata: Metadata = {
  title: "SecretGift",
  description: "SecretGift - מתנות דיגיטליות עם כרטיס גירוד",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased min-h-screen bg-gray-50">
        {children}
        <SiteCredit />
        <Analytics />
      </body>
    </html>
  );
}
