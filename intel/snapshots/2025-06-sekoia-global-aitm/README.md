# 2025-06 Sekoia "Global analysis of Adversary-in-the-Middle phishing threats"

**Canonical URL:** https://blog.sekoia.io/global-analysis-of-adversary-in-the-middle-phishing-threats/
**Authors:** Quentin Bourgue, Grégoire Clermont and TDR team
**Date:** June 2025
**TLP:** CLEAR
**Snapshot extracted:** 2026-05-17 from analyst-provided PDF via `pdftotext -layout`

## Contents

- `global-aitm-analysis.txt` — extracted text of the 39-page PDF report

## Why snapshotted

- Direct WebFetch of the canonical URL returns 403 (Cloudflare). The PDF
  is the authoritative source; this snapshot preserves the analyst's local
  copy under the OSINT allowlist's `file:///snapshots` path so the citation
  trail is reproducible.
- The report covers 11 kits with grounded fingerprints (App IDs, ASNs,
  URL regex, exfiltration paths). Multiple `intel/kits/<slug>/` drafts
  cite this snapshot via the canonical Sekoia URL.

## Kits covered (with prevalence score / 5)

| Rank | Kit                | Score | Aliases                                  |
|------|--------------------|-------|------------------------------------------|
| 1    | Tycoon 2FA         | 4.8   | Storm-1747                               |
| 2    | Storm-1167         | 4.2   | FlowerStorm                              |
| 3    | NakedPages         | 4.0   | Storm-1101, SakaiPages, ironsentry       |
| 4    | Sneaky 2FA         | 3.6   | Sneaky Log, WikiKit                      |
| 5    | EvilProxy          | 3.2   | Storm-0835                               |
| 6    | Evilginx - ywnjb   | 3.2   | (open-source `kgretzky` phishlet variant)|
| 7    | Saiga 2FA          | 2.0   | SAIGA Page                               |
| 8    | Greatness          | 2.0   | Storm-1295                               |
| 9    | Mamba 2FA          | 1.75  | —                                        |
| 10   | Gabagool           | 1.6   | Skyw4lker                                |
| 11   | CEPHAS             | 0.6   | W3LL Panel, OV6                          |
