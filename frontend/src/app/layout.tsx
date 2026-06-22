import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WhatsFlow - WhatsApp Sales CRM SaaS",
  description: "WhatsFlow connects WhatsApp with a premium CRM. Sync chats, capture leads, detect sales orders, and scale outreach automatically with AI Sales Assistants.",
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
    title: "WhatsFlow - WhatsApp Sales CRM",
    description: "Scale WhatsApp outreach with AI replies, chat sync, lead intent parsing, and automated sales order drafts.",
    url: "https://whatsflow.com",
    siteName: "WhatsFlow CRM",
    images: [
      {
        url: "/logo-icon.png",
        width: 512,
        height: 512,
        alt: "WhatsFlow CRM Logo"
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
