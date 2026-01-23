import type { Metadata } from "next";
import { Instrument_Sans, Cormorant_Garamond, Space_Grotesk } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { GsapProvider } from "@/components/gsap-provider";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { SmoothCursor } from "@/components/ui/smooth-cursor";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TunePort | YouTube to Spotify Sync",
    template: "%s | TunePort",
  },
  description: "Sync YouTube to Spotify with zero friction. Match tracks, add to playlists, and download audio locally.",
  keywords: ["TunePort", "YouTube to Spotify", "music sync", "playlist transfer", "Opus audio"],
  metadataBase: new URL("https://tuneport.micr.dev"),
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/logo.png", type: "image/png", sizes: "512x512" },
    ],
  },
  openGraph: {
    title: "TunePort | YouTube to Spotify Sync",
    description: "Sync YouTube to Spotify with zero friction. Match tracks, add to playlists, and download audio locally.",
    url: "https://tuneport.micr.dev",
    siteName: "TunePort",
    type: "website",
    images: [{
      url: "/logo.png",
      width: 512,
      height: 512,
      alt: "TunePort logo",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TunePort | YouTube to Spotify Sync",
    description: "Sync YouTube to Spotify with zero friction. Match tracks, add to playlists, and download audio locally.",
    images: ["/logo.png"],
  },
  other: {
    "theme-color": "#10b981",
  },
  alternates: {
    canonical: "https://tuneport.micr.dev",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "TunePort",
    "description": "Sync YouTube to Spotify with zero friction. Match tracks, add to playlists, and download audio locally.",
    "url": "https://tuneport.micr.dev",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "Chrome",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "author": {
      "@type": "Person",
      "name": "Microck",
      "url": "https://github.com/Microck"
    }
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${instrumentSans.variable} ${cormorantGaramond.variable} ${spaceGrotesk.variable} antialiased font-sans`}
      >
        <GsapProvider>
          <ScrollProgress />
          <SmoothCursor />
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-slate-900 focus:rounded-md focus:shadow-lg">
            Skip to content
          </a>
          <div id="smooth-wrapper">
            <div id="smooth-content">
              <Header />
              <main id="main-content" className="flex min-h-screen flex-col">
                {children}
              </main>
              <Footer />
            </div>
          </div>
        </GsapProvider>
      </body>
    </html>
  );
}
