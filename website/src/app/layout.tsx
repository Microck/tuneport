import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
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

export const metadata: Metadata = {
  title: {
    default: "TunePort | YouTube to Spotify Sync",
    template: "%s | TunePort",
  },
  description: "Sync YouTube to Spotify with zero friction. Match tracks, add to playlists, and download audio locally.",
  keywords: ["TunePort", "YouTube to Spotify", "music sync", "playlist transfer", "Opus audio"],
  metadataBase: new URL("https://tuneflow.micr.dev"),
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
    url: "https://tuneflow.micr.dev",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${instrumentSans.variable} antialiased`}
      >
        <GsapProvider>
          <ScrollProgress />
          <SmoothCursor />
          <div id="smooth-wrapper">
            <div id="smooth-content">
              <Header />
              <main className="flex min-h-screen flex-col">
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
