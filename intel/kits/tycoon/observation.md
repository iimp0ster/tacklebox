# tycoon observation -- 2026-05-17

> Skill: `aitm-kit-ttp-collector`. Input: kit hypothesis "Tycoon 2FA".

## Kit identification

Tycoon 2FA is a PhaaS AiTM reverse-proxy kit profiled by Sekoia TDR in
March 2024 and tracked through multiple version revisions. Distinguishing
characteristics:

- Lure pages typically on random-character subdomains under `.ru`, `.es`,
  `.com`, and `.cloud` TLDs; often Cloudflare-fronted.
- Hosted JS payload at `/auth/<random>` paths fetched after the initial
  page load; the bundle implements the reverse-proxy bridge to
  `login.microsoftonline.com`.
- Captures username, password, MFA challenge, and the resulting session
  cookie set by Microsoft for the victim.
- Operator-side dashboard sells captured cookies for downstream replay.

URLScan query that hits (see `SKILL.md`):

```
page.url:*/auth/* AND filename:"*.js" AND NOT page.domain:microsoftonline.com
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

## Sources consulted

Tier 1:
- Sekoia TDR -- "Tycoon 2FA: an in-depth analysis of the latest version
  of the AiTM phishing kit" --
  `https://blog.sekoia.io/tycoon-2fa-an-in-depth-analysis-of-the-latest-version-of-the-aitm-phishing-kit/`
  (URL is the citation anchor; verify the exact post slug against
  blog.sekoia.io before promotion.)
- Microsoft Threat Intelligence -- Storm-1575 / AiTM PhaaS coverage
  (Microsoft has tracked Tycoon under the Storm-XXXX taxonomy; exact post
  URL not anchored here. Cite during promotion.)

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
