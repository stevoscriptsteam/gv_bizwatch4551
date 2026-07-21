import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/lib/fontawesome";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BizWatch | Community safety reporting for Caloundra & 4551",
  description:
    "BizWatch 4551 is a private community safety service for approved businesses across Caloundra and postcode 4551.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU" className={`${inter.variable} h-full`}>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body
        className="min-h-full flex flex-col bg-grey-50 text-grey-950 antialiased"
        style={{
          minHeight: "100%",
          display: "flex",
          flexDirection: "column",
          background: "var(--grey-50)",
          color: "var(--grey-950)",
        }}
      >
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AppHeader />
        <main id="main-content" className="site-main flex-1">
          {children}
        </main>
        <AppFooter />
      </body>
    </html>
  );
}
