import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "sonner";
import { PWAListener } from "@/components/pwa/PWAListener";

export const metadata: Metadata = {
  title: "FinaX",
  description: "Gérez vos finances personnelles et votre micro-entreprise",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FinaX",
  },
};

export const viewport: Viewport = {
  themeColor: "#1B8F72",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          {children}
          <Toaster position="top-center" richColors closeButton />
          <PWAListener />
        </ThemeProvider>
      </body>
    </html>
  );
}
