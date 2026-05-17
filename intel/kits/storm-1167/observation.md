# storm-1167 observation -- 2026-05-17

> Skill: `aitm-kit-ttp-collector`. Source: Sekoia June 2025 "Global
> analysis of Adversary-in-the-Middle phishing threats" report, kit
> sheet p~24. Snapshot: `intel/snapshots/2025-06-sekoia-global-aitm/`.

## Kit identification

Storm-1167 (alias **FlowerStorm**) is a PhaaS **synchronous-relay** AiTM
kit first reported by Microsoft TI in June 2023 and ranked #2 by
prevalence in Sekoia's June 2025 ecosystem analysis (score 4.2/5).
Major-PhaaS status since April 2023. Sekoia assesses the kit has
"several hundred active affiliates" inferred from registered domains.

Strong technical and operational similarities with the now-defunct
Rockstar 2FA, which disappeared in Q4 2024 -- some analysts treat
FlowerStorm as Rockstar's successor.

Grounded fingerprints (Sekoia 2025-06):

- **Phishing domain TLDs:** mostly `.it.com` FQDNs since mid-February
  2025; previously `.com` or `.de` themed around business / technology /
  finance / legal.
- **JavaScript host:** Tencent Cloud Object Storage --
  `<bucket>-<appid>.cos.ap-<region>.myqcloud.com`
  (e.g. `5425043750-1317754460.cos.ap-tokyo.myqcloud.com`).
- **Exfiltration:** `POST /google.php` to a single
  `[0-9]{9,10}\.(cfd|sbs|xyz|my\.id)` domain per affiliate (until
  mid-March 2025); since then, the exfil endpoint lives on the
  phishing FQDN itself.
- **App ID:** `4765445b-32c6-49b0-83e6-1d93765276ca` (OfficeHome).
- **Top ASs:** AS132203 (Tencent, DE / US), AS19871 (Network Solutions, US).
- **Anti-bot:** custom Cloudflare Turnstile with Microsoft logo,
  randomly-generated lowercase HTML titles, multi-language HTML comments
  (English, French, German, Arabic, Spanish) formerly using a nature
  theme (flowers, fruits) -- origin of the FlowerStorm alias.

URLScan queries (see `SKILL.md` for the full library):

```
task.url:*.cos.ap-*.myqcloud.com AND page.title:"Sign in to your Microsoft account"
page.domain:*.it.com AND filename:"google.php"
```

## Post-auth behaviors observed

| Behavior                                            | T-ID       | Draft atomic                              |
|-----------------------------------------------------|------------|-------------------------------------------|
| AiTM session cookie capture via synchronous relay   | T1539      | `atomics/T1539.draft.yaml`                |
| Refresh-token replay against Exchange/Graph         | T1550.001  | `atomics/T1550.001.draft.yaml`            |
| Inbox forwarding rule for persistence/exfil         | T1114.003  | `atomics/T1114.003.draft.yaml`            |

All three carry `_mapping_confidence: medium`. Sekoia's report does not
explicitly map the kit's behaviors to MITRE T-IDs; mappings are the
consensus PhaaS-AiTM mapping.

## Lab-safe primitive vs. observed TTP

Storm-1167 captures session cookies via a synchronous-relay
(operator-managed central server reverse-proxying through Tencent CDN
JavaScript). Tacklebox does **not** stand up a relay or proxy through
operator infrastructure. The T1539 draft atomic emulates capture by
performing an interactive Tacklebox-client signin and persisting the
resulting Microsoft-issued cookie for downstream replay.

Telemetry shape similarities and differences vs. a real FlowerStorm
compromise:

- **Present in both:** signin record on the victim account against App ID
  `4765445b-...` (OfficeHome); refresh-token redemption to the chained
  resource; the inbox-rule audit event.
- **Absent in the lab-safe primitive:** the Tencent CDN download trail
  in browser logs (kit-side JS fetched from `*.cos.ap-*.myqcloud.com`);
  the AS132203 / AS19871 source ASN that distinguishes FlowerStorm
  signins from other PhaaS in the wild; the `/google.php` exfiltration
  POST.

A promoted Storm-1167 T1539 atomic should call this out in its
`description` so reviewers understand the telemetry expectations are
scoped to the substituted primitive, not the full relay path.

## Sources consulted

Tier 1:
- Sekoia TDR -- "Global analysis of Adversary-in-the-Middle phishing
  threats" (June 2025) --
  `https://blog.sekoia.io/global-analysis-of-adversary-in-the-middle-phishing-threats/`
  Local snapshot: `intel/snapshots/2025-06-sekoia-global-aitm/`.
  Kit sheet section grounds App ID, ASs, URL patterns, infrastructure
  description, and the FlowerStorm alias.
- Microsoft TI -- "Detecting and mitigating a multi-stage AiTM phishing
  and BEC campaign" (June 2023). Cited in the Sekoia kit sheet
  bibliography; original post anchors the Storm-1167 designation.

Tier 2 (referenced for cross-context, not grounding any primary claim):
- Sophos X-Ops -- "Phishing platform Rockstar 2FA trips, and 'FlowerStorm'
  picks up the pieces" (December 2024). Useful background on the
  Rockstar -> FlowerStorm succession.

Canonical:
- Microsoft Learn -- Entra sign-in log schema, Exchange UAL fields.

## Promotion workflow notes

- All three draft atomics carry `_citations` and `_mapping_confidence` --
  strip both at promotion.
- Draft executors `throw "stub"`. The promotion implementer wraps
  TokenTacticsV2 / AADInternals / roadtx for the cookie-capture and
  refresh-token primitives, and Microsoft.Graph or
  ExchangeOnlineManagement for the inbox-rule step.

## Promotion targets in the current production tree

| Draft                              | Existing atomic that matches            | Decision                                                            |
|------------------------------------|-----------------------------------------|---------------------------------------------------------------------|
| `T1539.draft.yaml` (AiTM capture)  | `atomics/T1539-cookie-replay/`          | **Create new** `atomics/T1539-aitm-cookie-capture/` -- capture and replay are distinct primitives. Note: the Tycoon draft also targets this slug; consolidate Tycoon + Storm-1167 into a single new atomic file with both kits as `atomic_tests[]` entries. |
| `T1550.001.draft.yaml`             | `atomics/T1550.001-token-refresh-swap/` | **Consolidate** -- append a Storm-1167-flavored entry to `atomic_tests[]`. |
| `T1114.003.draft.yaml`             | `atomics/T1114.003-email-rules-exfil/`  | **Consolidate** -- append a Storm-1167-flavored entry to `atomic_tests[]`. |

At promotion, the rig's `steps[*].atomic` and `requires_token_from` get
rewritten from bare T-IDs to the chosen full slug-form IDs.

## Open questions

- [ ] Confirm whether `1167` is still the Microsoft-tracked designation
      or has been folded under a newer Storm-2XXX. Sekoia uses
      Storm-1167 throughout the June 2025 report.
- [ ] Verify which Entra `AuthenticationProtocol` is emitted when a
      stolen session cookie is replayed via a non-Microsoft client.
      Currently `<UNKNOWN>` in T1539 draft.
- [ ] Map each step to a chokepoint ID once
      `iimp0ster.github.io/detection-chokepoints/` publishes
      AiTM-cookie-capture / refresh-token-replay / inbox-forwarding-rule
      family IDs.
