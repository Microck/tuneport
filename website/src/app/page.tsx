import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Features } from "@/components/sections/features";
import { Flow } from "@/components/sections/flow";
import { Hero } from "@/components/sections/hero";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <Header />
      <Hero />
      <Features />
      <Flow />
      <Footer />
    </main>
  );
}