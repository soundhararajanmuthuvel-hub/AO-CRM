import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cusman CRM - AI-Powered Customer Growth Platform",
  description: "Cusman CRM by DK's Technologies helps businesses acquire customers, automate sales and marketing, sync WhatsApp conversations, detect client intents, and grow revenue.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" }
    ],
    apple: [
      { url: "/logo-icon.png", sizes: "180x180", type: "image/png" }
    ]
  },
  openGraph: {
    title: "Cusman CRM - Turn Conversations Into Customers",
    description: "Scale business growth, track leads pipeline, automate follow-ups, and manage WhatsApp teams with Cusman CRM.",
    url: "https://cusmancrm.com",
    siteName: "Cusman CRM",
    images: [
      {
        url: "/logo-icon.png",
        width: 512,
        height: 512,
        alt: "Cusman CRM Logo"
      }
    ],
    locale: "en_US",
    type: "website"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100 font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
