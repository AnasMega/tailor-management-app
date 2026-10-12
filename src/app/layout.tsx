import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Royal Bespoke Tailor Management System | Complete Silai, Naap & Khata ERP",
  description:
    "Comprehensive Tailor Management Application with Multi-Shop Support, Customer Naap Book, Order Parchi & Invoice Printing, Dynamic Stitching Rate Card, and Udhaar Khata Ledger.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-slate-50 text-slate-900"
      >
        {children}
      </body>
    </html>
  );
}
