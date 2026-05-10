# Tacklebox

> AiTM phishing kit emulation framework for M365 / Entra detection engineering.
> Every lure, every hook, every kit. One tacklebox.

Tacklebox is the empirical-validation counterpart to the
[Detection Chokepoints framework](https://iimp0ster.github.io/detection-chokepoints/).
It is a PowerShell 7 module that emulates the post-authentication behavior of
adversary-in-the-middle (AiTM) phishing kits — Tycoon 2FA, Mamba 2FA, Sneaky
2FA, EvilProxy, Rockstar/FlowerStorm, ONNX, Greatness, Evilginx, plus Device
Code Flow phishing — against a labeled lab tenant, then verifies that the
expected telemetry actually appeared in Entra signin logs and the Unified
Audit Log.

## Status

**Pre-v1 — Phase 0 (skeleton).** No atomics are runnable yet. See
`.claude/plans/` for the implementation plan.

## Vocabulary

The fishing vocabulary is intentional and consistent:

- **Atomics** are *tackle* — individual pieces of gear
- **Kit profiles** are *rigs* — assembled gear for a specific target
- **Chokepoint validation** is *checking your hooks* — confirming the gear works
- **Telemetry events** are the *bite* — proof the lure was taken

## Lab-tenant only

Tacklebox refuses to run against a tenant that does not match a labeled lab
pattern. This is enforced at module load. There is an override flag, but it
logs a prominent warning and requires explicit confirmation.

**Do not run this framework against production tenants.**

## Wrap-don't-write

Tacklebox is an orchestration and telemetry-validation framework, not an
attack-research project. ~85% of v1's executors wrap existing tools
(roadtools, TokenTacticsV2, GraphRunner, AADInternals, Microsoft.Graph SDK,
ExchangeOnlineManagement). The framework's own code is the schema parser,
token-chain resolver, telemetry harness, lab-safety enforcement, and
chokepoint coverage reporter.

## License

License selection deferred to v1 release. See `docs/v3-vision.md` for dual-use
disclosure considerations.
