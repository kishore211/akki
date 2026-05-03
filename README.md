# The Data Nexus: Journey to 2035

Interactive Astro/Vercel capstone showcase exploring the future of data warehousing, data mining, autonomous infrastructure, cognitive privacy, synthetic reality, and privacy-preserving cryptography.

The current implementation replaces the original AstroWind template homepage with a single-page exhibit built from the attached PRD.

## Experience

- Scroll-driven exhibit narrative from the 2025 lakehouse baseline to 2035 agentic data infrastructure.
- Three.js Global Data Pulse with local Blue Marble-style Earth imagery, cloud texture, pulsing regional markers, and route arcs.
- Scroll-aware Evolution Lab comparing centralized server farms with distributed edge intelligence.
- Dilemma Simulator for the biometric health-data ethics scenario.
- Clickable cryptographic nodes for Federated Learning, Fully Homomorphic Encryption, and Zero-Knowledge Proofs.
- Audience Mission Control with QR onboarding, local vote fallback, and live exhibit meters.
- Analytics-ready custom events with a no-op fallback when GA4 is not configured.

## Commands

```bash
npm install
npm run dev
npm run check
npm run build
npm run preview
```

## Deployment

The project remains a static Astro site and is compatible with Vercel's default Astro deployment flow.

The current production URL is `https://data-nexus-three.vercel.app`. Before the live showcase, update `src/config.yaml` only if that URL changes or if an analytics ID is required.

Optional public environment variables:

```bash
PUBLIC_SHOWCASE_URL=https://data-nexus-three.vercel.app
PUBLIC_POLL_EMBED_URL=https://your-poll-provider/embed/link
```

`PUBLIC_SHOWCASE_URL` is used to generate the QR code in Mission Control. `PUBLIC_POLL_EMBED_URL` can point to a Slido, Mentimeter, or similar poll embed. If no poll URL is configured, the page renders an interactive client-side vote fallback.

## Presentation Notes

- Use the Overview section as the QR onboarding screen.
- Pause at the Global Data Pulse to connect infrastructure to geography and regulation.
- Use the Evolution Slider to explain the sustainability paradox.
- Run the Dilemma Simulator with the audience before revealing the chosen consequence.
- Close with the Cryptography and Showcase sections to connect the technical solution back to the capstone rubric.

## Visual Assets

- `public/assets/data-nexus/earth-blue-marble-2048.jpg` and `public/assets/data-nexus/earth-clouds-1024.png` are local Earth texture assets used by the Global Data Pulse. They are sourced from the public Three.js example planet texture set and loaded locally so the presentation does not depend on external image requests.
