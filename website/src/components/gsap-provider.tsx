"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

type GsapProviderProps = {
  children: React.ReactNode;
};

export function GsapProvider({ children }: GsapProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useGSAP(
    () => {
      const context = gsap.context(() => {
        const textTargets = gsap.utils.toArray<HTMLElement>("[data-animate='text']");
        const buttonTargets = gsap.utils.toArray<HTMLElement>("[data-animate='button']");

        textTargets.forEach((target) => {
          gsap.fromTo(
            target,
            { opacity: 0, y: 18, filter: "blur(6px)" },
            {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.6,
              ease: "power3.out",
              scrollTrigger: {
                trigger: target,
                start: "top 85%",
              },
            }
          );
        });

        const cleanups: Array<() => void> = [];

        buttonTargets.forEach((target) => {
          gsap.fromTo(
            target,
            { opacity: 0, y: 10 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              ease: "power3.out",
              scrollTrigger: {
                trigger: target,
                start: "top 90%",
              },
            }
          );

          const onEnter = () => {
            gsap.to(target, {
              scale: 1.04,
              duration: 0.2,
              ease: "power2.out",
            });
          };

          const onLeave = () => {
            gsap.to(target, {
              scale: 1,
              duration: 0.2,
              ease: "power2.out",
            });
          };

          target.addEventListener("mouseenter", onEnter);
          target.addEventListener("mouseleave", onLeave);

          cleanups.push(() => {
            target.removeEventListener("mouseenter", onEnter);
            target.removeEventListener("mouseleave", onLeave);
          });
        });

        return () => {
          cleanups.forEach((cleanup) => cleanup());
          ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
        };
      }, containerRef);

      return () => context.revert();
    },
    { dependencies: [pathname], scope: containerRef }
  );

  return <div ref={containerRef}>{children}</div>;
}
