# Contributing to Tacklebox

Tacklebox welcomes defensive research, detection engineering, documentation, and lab-safe emulation contributions.

## Before opening a pull request

- Open an issue for a new kit, new atomic, or material evidence claim.
- Cite public sources and distinguish sourced fact, local observation, inference, synthetic fixtures, open questions, and coverage limitations.
- Defang indicators intended for publication. Never commit credentials, tokens, session material, raw captures, provider responses, active infrastructure configuration, or live IOC collections.
- Keep emulation constrained to isolated, labeled lab tenants and snapshot-bracketed ranges. Do not test against production or third-party systems.
- Include executable cleanup and cleanup verification for production atomics.
- Explain how the change improves a defender's ability to understand, emulate, observe, or detect the behavior.

## Validation

For PowerShell framework changes, run the repository Pester and PSScriptAnalyzer checks.

For public-site changes:

```bash
cd site
npm ci
npm run build
node --test tests/*.test.mjs
npm run test:ui
```

If a sensor or external provider cannot be queried, report the result as partial, pending, unavailable, or coverage-limited rather than treating it as negative evidence.
