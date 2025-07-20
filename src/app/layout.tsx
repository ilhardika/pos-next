import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import "../styles/toast.css";
import { AuthProvider } from "@/hooks/useAuth";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistem POS - Point of Sale",
  description: "Sistem Point of Sale untuk UMKM Indonesia",
  keywords: ["POS", "Point of Sale", "UMKM", "Kasir", "Penjualan", "Indonesia"],
  authors: [{ name: "POS System" }],
  creator: "POS System",
  publisher: "POS System",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon.svg" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icon.svg",
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "POS System",
  },
  openGraph: {
    type: "website",
    siteName: "Sistem POS",
    title: "Sistem POS - Point of Sale",
    description: "Sistem Point of Sale untuk UMKM Indonesia",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "POS System Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Sistem POS - Point of Sale",
    description: "Sistem Point of Sale untuk UMKM Indonesia",
    images: ["/icon-512.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <meta name="application-name" content="POS System" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="POS System" />
        <meta
          name="description"
          content="Sistem Point of Sale untuk UMKM Indonesia"
        />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#3b82f6" />

        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon.svg" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon.svg" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icon.svg" color="#3b82f6" />
        <link rel="shortcut icon" href="/icon.svg" />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content="https://pos-system.vercel.app" />
        <meta name="twitter:title" content="Sistem POS - Point of Sale" />
        <meta
          name="twitter:description"
          content="Sistem Point of Sale untuk UMKM Indonesia"
        />
        <meta
          name="twitter:image"
          content="https://pos-system.vercel.app/icon-192.png"
        />
        <meta name="twitter:creator" content="@pos_system" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Sistem POS - Point of Sale" />
        <meta
          property="og:description"
          content="Sistem Point of Sale untuk UMKM Indonesia"
        />
        <meta property="og:site_name" content="POS System" />
        <meta property="og:url" content="https://pos-system.vercel.app" />
        <meta
          property="og:image"
          content="https://pos-system.vercel.app/icon-512.png"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
        <PWAInstallPrompt />
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={5000}
          expand={true}
          visibleToasts={5}
        />
      </body>
    </html>
  );
}
