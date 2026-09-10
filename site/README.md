# Tacklebox AiTM Field Guide

The public Tacklebox site helps defenders compare AiTM kit behavior, inspect evidence-backed attack paths and lure anatomy, and connect observed tradecraft to lab-safe emulation and detection opportunities.

Live site: [iimp0ster.github.io/tacklebox](https://iimp0ster.github.io/tacklebox/)

## V1 scope

- Tycoon 2FA and Sneaky 2FA infrastructure and lure field guides.
- A cross-kit behavior matrix with evidence and applicability states.
- Atomic references organized by test, tactic, and kit.
- Explicit validation, telemetry, cleanup, and emulation-delta labels.
- BigBear 2.0 retained as **Evidence gathering** until its field guide meets the same evidence threshold.

Tacklebox publishes defanged, bounded evidence. Do not add credentials, session material, raw captures, active infrastructure, provider responses, or deployable phishing configuration.

## Local development

Requires Node.js 22.13 or newer.

```bash
npm ci
npm run build
npm run test:ui
```

Run `npm run dev` for a local development server. Content generation is deterministic and runs automatically before production builds.

## Contributing

Open an issue before adding a new kit or materially changing a published claim. Contributions should include public provenance, a clear evidence classification, caveats, and a lab-safe emulation boundary. See the repository-level [contribution guide](../CONTRIBUTING.md).
