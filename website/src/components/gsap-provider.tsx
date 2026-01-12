"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

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

        let smoother: ScrollSmoother | null = null;
        if (document.querySelector("#smooth-wrapper") && document.querySelector("#smooth-content")) {
          smoother = ScrollSmoother.create({
            wrapper: "#smooth-wrapper",
            content: "#smooth-content",
            smooth: 1,
            smoothTouch: 0.1,
            normalizeScroll: true,
          });
        }

        const getTextAnimation = (variant: string | undefined) => {
          switch (variant) {
            case "slide-up":
              return {
                from: { opacity: 0, y: 20 },
                to: { opacity: 1, y: 0 },
              };
            case "slide-down":
              return {
                from: { opacity: 0, y: -20 },
                to: { opacity: 1, y: 0 },
              };
            case "slide-left":
              return {
                from: { opacity: 0, x: 20 },
                to: { opacity: 1, x: 0 },
              };
            case "slide-right":
              return {
                from: { opacity: 0, x: -20 },
                to: { opacity: 1, x: 0 },
              };
            case "blur-up":
              return {
                from: { opacity: 0, y: 18, filter: "blur(6px)" },
                to: { opacity: 1, y: 0, filter: "blur(0px)" },
              };
            case "blur":
              return {
                from: { opacity: 0, filter: "blur(6px)" },
                to: { opacity: 1, filter: "blur(0px)" },
              };
            case "fade":
            default:
              return {
                from: { opacity: 0 },
                to: { opacity: 1 },
              };
          }
        };

        textTargets.forEach((target) => {
          const variant = target.dataset.animateVariant;
          const { from, to } = getTextAnimation(variant);

          gsap.fromTo(
            target,
            from,
            {
              ...to,
              duration: 0.55,
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
          smoother?.kill();
        };
      }, containerRef);

      return () => context.revert();
    },
    { dependencies: [pathname], scope: containerRef }
  );

  return <div ref={containerRef}>{children}</div>;
}
