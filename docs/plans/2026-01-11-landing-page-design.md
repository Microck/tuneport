# Design Document: TunePort "Award-Winning" Landing Page

## 1. Overview
A high-performance, visually stunning landing page for the TunePort browser extension.
**Goal:** Convert the existing static site into a Next.js application that leverages advanced UI libraries (Magic UI, Shadcn) to create an "award-winning" user experience.
**Aesthetic:** "New York" style (Clean, Dark, Zinc/Slate) + Emerald Accents + Glassmorphism + High-end Motion.

## 2. Architecture
- **Framework:** Next.js 14+ (App Router).
- **Styling:** Tailwind CSS + `shadcn/ui` theme configuration.
- **Animation:** `framer-motion` (core), `magic-ui` (effects).
- **3D/Visuals:** `three.js` / `react-three-fiber` for subtle floating elements, combined with CSS 3D transforms for the video container.
- **Deployment:** Static export to GitHub Pages (already configured).

## 3. Key Sections & Components

### 3.1. Hero Section ("The Portal")
- **Background:** `AnimatedGridPattern` or `RetroGrid` (Magic UI) in dark emerald/slate.
- **Main Element:** A **3D Tilt-Enabled Video Container** holding `tuneport.mp4`.
    - Effect: `BorderBeam` (Magic UI) rotating around the frame.
    - Interaction: Mouse hover tilts the container (perspective 3D).
- **Typography:**
    - Headline: "Sync. Download. *Disappear*." (Split text animation).
    - CTA: `ShimmerButton` (Magic UI) "Add to Chrome".

### 3.2. Features ("The Bento")
- Layout: **Bento Grid** (Magic UI).
- Cards:
    1.  **Instant Sync:** Icon pulsates when hovered.
    2.  **Lossless Audio:** Visualizer bars reacting to dummy audio data.
    3.  **Smart Matching:** Text scrambling/decoding effect (simulating the algorithm).
    4.  **Privacy:** A shield with a glowing "lock" animation.

### 3.3. "How it Works" ("The Flow")
- **Animated Beam:** A connecting line (`AnimatedBeam`) that draws itself from a "YouTube" icon to a "Spotify" icon as the user scrolls, visualizing the extension's bridge function.

### 3.4. Footer
- Minimalist, heavily blurred glass background.
- Large "TunePort" watermark text.

## 4. Implementation Plan (Automated)
1.  **Setup:** Initialize Next.js in `website/`.
2.  **Config:** Port `tailwind.config.js` and `components.json` settings.
3.  **Dependencies:** Install `framer-motion`, `magic-ui` components, `lucide-react`.
4.  **Assets:** Move `tuneport.mp4` and images to `public/`.
5.  **Develop:** Build sections iteratively.
6.  **Deploy:** Update GitHub Actions workflow for Next.js static export.

## 5. Success Criteria
- [ ] 100/100 Lighthouse Performance.
- [ ] Zero layout shift.
- [ ] "Wow" factor achieved via motion design.
