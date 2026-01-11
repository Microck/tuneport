import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
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
  metadataBase: new URL("https://tuneflow.micr.dev"),
  openGraph: {
    title: "TunePort | YouTube to Spotify Sync",
    description: "Sync YouTube to Spotify with zero friction. Match tracks, add to playlists, and download audio locally.",
    url: "https://tuneflow.micr.dev",
    siteName: "TunePort",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TunePort | YouTube to Spotify Sync",
    description: "Sync YouTube to Spotify with zero friction. Match tracks, add to playlists, and download audio locally.",
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
        <Header />
        <main className="flex min-h-screen flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
