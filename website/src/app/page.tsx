import { Footer } from "@/components/layout/footer";
import { Features } from "@/components/sections/features";
import { Flow } from "@/components/sections/flow";
import { Hero } from "@/components/sections/hero";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <Hero />
      <Features />
      <Flow />
      <Footer />
    </main>
  );
}
