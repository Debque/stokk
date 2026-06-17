import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Stokk — Smart Inventory & Profit Management",
  description: "Real-time stock visibility, automatic profit tracking, and full IMEI accountability for phone retailers. Built for HOPEX COMMS.",
  keywords: ["inventory management", "profit tracking", "IMEI tracker", "phone store", "Nigeria"],
  authors: [{ name: "Stokk" }],
  creator: "Stokk",
  metadataBase: new URL("https://stokkco.com"),
  openGraph: {
    title: "Stokk — Know what you have. Know what you made.",
    description: "Real-time stock visibility, automatic profit tracking, and full IMEI accountability — all in one place. Built for HOPEX COMMS.",
    url: "https://stokkco.com",
    siteName: "Stokk",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Stokk — Smart Inventory & Profit Management",
      },
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stokk — Smart Inventory & Profit Management",
    description: "Real-time stock visibility, automatic profit tracking, and full IMEI accountability for phone retailers.",
    images: ["/og-image.svg"],
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}