# tycoon observation -- 2026-05-17

> Skill: `aitm-kit-ttp-collector`. Input: kit hypothesis "Tycoon 2FA".

## Kit identification

Tycoon 2FA is a PhaaS **synchronous-relay** AiTM kit, tracked by Microsoft
as **Storm-1747**. PhaaS since August 2023, sold on Telegram. Per Sekoia's
June 2025 "Global analysis of Adversary-in-the-Middle phishing threats",
Tycoon 2FA was the highest-prevalence AiTM kit in Q1 2025 (score 4.8/5)
and reuses source from the older Dadsec OTT kit.

Grounded fingerprints (Sekoia 2025-06):

- **Domain pattern:** mostly `[a-z0-9]{2,6}\.[a-z]{5,15}\.(ru|com|es)`
  (also `.cc`, `.info`, `.su`, `.vip` and other TLDs).
- **Autograb URL patterns:**
  - `https://<domain>/[a-zA-Z0-9@!]{4,15}/($|*|?em=|)<email-address>`
  - `https://<domain>/[a-zA-Z0-9]{0,15}@[a-zA-Z0-9]{0,15}/`
  - `https://<domain>/[a-zA-Z0-9]{0,15}@[a-zA-Z0-9]{0,15}/($|*)<username-email-address>`
- **Auth path:** `/auth/<random>` hosts an obfuscated JS bundle using
  `crypto-js` AES + base64.
- **App ID:** `4765445b-32c6-49b0-83e6-1d93765276ca` (OfficeHome).
- **Top ASs:** AS9009, AS29802.
- **Code indicators:** fetches `code.jquery.com/jquery-3.6.0.min.js` and
  `cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js`;
  unicode zero-width-space `U+200B` in HTML `<title>`.
- **Anti-bot:** custom CAPTCHA + fake Cloudflare Turnstile / hCaptcha /
  reCAPTCHA; integrates the BlackTDS service for traffic filtering.

URLScan queries (see `SKILL.md` for the full library):

```
page.url:*/auth/* AND filename:"*.js" AND NOT page.domain:microsoftonline.com
```

Tighter grounded pivot from the report:

```
page.domain:/[a-z0-9]{2,6}\.[a-z]{5,15}\.(ru|com|es)/ AND page.title:"Sign in to your Microsoft account"
```

## Post-auth behaviors observed

| Behavior                                            | T-ID       | Draft atomic                              |
|-----------------------------------------------------|------------|-------------------------------------------|
| AiTM session cookie capture via reverse-proxy relay | T1539      | `atomics/T1539.draft.yaml`                |
| Refresh-token replay against Exchange/Graph         | T1550.001  | `atomics/T1550.001.draft.yaml`            |
| Inbox forwarding rule for persistence/exfil         | T1114.003  | `atomics/T1114.003.draft.yaml`            |

All three carry `_mapping_confidence: medium`. Tycoon's AiTM mechanic maps
to T1539 by consensus across Sekoia, Microsoft TI, and Push Security; the
chained refresh-token pivot and rule creation are standard post-AiTM
behaviors documented across the same sources.

## Lab-safe primitive vs. observed TTP

Tycoon 2FA captures session cookies via reverse-proxy AiTM relay. Tacklebox
deliberately does **not** stand up a relay. The T1539 draft atomic emulates
the capture step by performing an interactive Tacklebox-client signin and
persisting the resulting Microsoft-issued cookie to disk for downstream
replay. Telemetry shape is similar but not identical:

- Present in both: signin record on the victim account, refresh-token
  redemption to the chained resource, the inbox-rule audit event.
- Absent in the lab-safe primitive: the relayed-signin UA pattern (kit
  hosts pose as the legitimate Microsoft login page; lab-safe signin uses
  the Tacklebox client UA), and the operator-side cookie marketplace
  artifacts.

A promoted Tycoon T1539 atomic should call this out in its `description`
so reviewers know the telemetry expectations are deliberately scoped to
the substituted primitive, not the full AiTM relay path.

## Sources consulted

Tier 1:
- Sekoia TDR -- "Global analysis of Adversary-in-the-Middle phishing
  threats" (June 2025) --
  `https://blog.sekoia.io/global-analysis-of-adversary-in-the-middle-phishing-threats/`
  Local snapshot: `intel/snapshots/2025-06-sekoia-global-aitm/`.
  Verbatim anchors used in atomic citations: kit sheet on p22, App ID,
  ASs, URL regex, autograb patterns, anti-bot stack, Dadsec OTT lineage.
- Sekoia TDR -- "Tycoon 2FA: an in-depth analysis of the latest version
  of the AiTM phishing kit" (March 2024) --
  `https://blog.sekoia.io/tycoon-2fa-an-in-depth-analysis-of-the-latest-version-of-the-aitm-phishing-kit/`
  Original per-kit deep-dive (verify the exact post slug at promotion).
- Microsoft Threat Intelligence -- Tycoon is tracked as Storm-1747
  (per the Sekoia 2025-06 report, p22; Microsoft's own post URL is not
  anchored here).

Canonical:
- Microsoft Learn -- Entra sign-in log schema, refresh-token signin
  `AuthenticationProtocol`, Exchange `New-InboxRule` audit shape.
  `https://learn.microsoft.com/en-us/entra/identity/monitoring-health/concept-sign-in-log-activity-details`
  `https://learn.microsoft.com/en-us/purview/audit-log-activities`

Tier 2 (context only, not grounding any single claim above):
- Proofpoint Threat Insight -- TA4901 attribution for Tycoon-using
  campaigns. Cite at promotion if a campaign-attribution claim is added.
- Trustwave SpiderLabs -- historical AiTM kit comparison context.

## Promotion workflow notes

- All three draft atomics intentionally carry `_citations` and
  `_mapping_confidence`, both forbidden by the production schema's
  `additionalProperties: false`. Strip both at promotion.
- Draft executors `throw "stub"`; promotion wraps a tool from
  `dependencies/manifests/` -- AADInternals/roadtx for cookie-capture
  emulation, TokenTacticsV2 for the refresh-token pivot, GraphRunner or
  ExchangeOnlineManagement for the inbox-rule step.
- An existing `rigs/tycoon.yaml` already emulates Tycoon's kill chain
  using device-code phishing as a proxy primitive (because Tacklebox does
  not stand up a real AiTM relay). This draft `rig.draft.yaml` describes
  the *actual* Tycoon chain (AiTM cookie capture -> refresh-token replay
  -> inbox rule). Promotion options:
    1. **Augment** `rigs/tycoon.yaml` with a comment that the existing
       device-code primitive is the lab-safe proxy; keep the rig as-is.
    2. **Replace** `rigs/tycoon.yaml` if the cookie-capture atomic is
       promoted as a real (lab-only) primitive.
    3. **Add a second rig** `rigs/tycoon-aitm.yaml` for the cookie-capture
       chain, leaving the device-code rig in place.
  Decision is human judgment, not within the skill's scope.

## Promotion targets in the current production tree

| Draft                              | Existing atomic that matches            | Decision                                                            |
|------------------------------------|-----------------------------------------|---------------------------------------------------------------------|
| `T1539.draft.yaml` (AiTM capture)  | `atomics/T1539-cookie-replay/`          | **Create new** `atomics/T1539-aitm-cookie-capture/` -- capture is a distinct behavior from replay |
| `T1550.001.draft.yaml`             | `atomics/T1550.001-token-refresh-swap/` | **Consolidate** -- append a Tycoon-flavored entry to `atomic_tests[]` |
| `T1114.003.draft.yaml`             | `atomics/T1114.003-email-rules-exfil/`  | **Consolidate** -- append a Tycoon-flavored entry to `atomic_tests[]` |

At promotion, the rig's `steps[*].atomic` and `requires_token_from` get
rewritten from bare T-IDs to the chosen full slug-form IDs.

## Open questions

- [ ] Confirm the Sekoia post slug. The URL above is the citation anchor;
      the validator only checks the `blog.sekoia.io` domain.
- [ ] Confirm Microsoft TI's current Storm-XXXX designation for the
      Tycoon operators (Storm-1575 was the older attribution; check for
      consolidation under a Storm-2XXX).
- [ ] Confirm `AuthenticationProtocol` field value emitted by Entra when
      a stolen session cookie is replayed via a non-Microsoft client.
      Currently `<UNKNOWN -- verify against MS docs>` in T1539 draft.
- [ ] Map each step to a `iimp0ster.github.io/detection-chokepoints/`
      ID once the AiTM-cookie-capture chokepoint family is published.
