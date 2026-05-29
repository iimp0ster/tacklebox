# lapsed-domain-aitm -> chokepoint mapping

Grounded by Sublime Security "AITM phishing with Russian infrastructure and
detection evasion from a lapsed domain" (June 12, 2025). Post-auth chokepoints
not included -- no post-auth behavior documented.

GROUNDING GAP: T1539 entry below has only one tier_2 citation. check_grounding.py
will fail until a tier_1 or second tier_2 co-citation is added.

| Step | T-ID  | Behavior                  | Chokepoint | URL                                                            | Confidence |
|------|-------|---------------------------|------------|----------------------------------------------------------------|------------|
| 1    | T1539 | AiTM session-cookie capture | CP-TODO  | https://iimp0ster.github.io/detection-chokepoints/CP-TODO      | M          |


## Detection context -- what makes this campaign distinctive

This campaign is notable for its DELIVERY evasion technique, not a novel
AiTM relay mechanism. The detection surface from the Sublime source is
primarily email-layer (out of Tacklebox scope) plus the infrastructure pattern.

**Email-layer (email_layer_detection -- Sublime alone sufficient):**
- Lapsed domain with valid SPF/DKIM passes reputation checks.
- Teams invitation lure with link to non-Microsoft domain.
- Sender mismatch detectable by Sublime MQL:
  https://sublime.security/feeds/core/detection-rules/brand-impersonation-microsoft-teams-invitation-46410ad8/

**Infrastructure pattern (ioc_volume -- Sublime alone sufficient):**
- Per-org subdomain: [victim-org-domain].team.ru[.]com -- useful for hunting
  additional targets in URLScan/Shodan by querying the team.ru.com pattern.
- Stage 3 hardcoded folder: 6802a801d7f11fb0bef7f792 -- may appear across
  multiple campaign instances.
- WSS endpoint UUID: 52e42e6675254286a4273c62f3b19bfb -- stable identifier
  within a campaign deployment.

**Entra/M365 telemetry (NOT grounded -- requires tier_1):**
- Source IP: Russian infrastructure (SmartApe OU, AS unknown from this source).
- appId: unknown (likely OfficeHome but unconfirmed).
- UA: unknown (relay mechanism not described by Sublime).
- All telemetry fields set to UNKNOWN in T1539.draft.yaml pending tier_1 grounding.


## Next steps to close grounding gap

1. Search URLScan for team.ru.com or team.za.com to identify the Stage 3 kit.
2. Cross-reference findings with Sekoia kit library (Tycoon, Mamba, Sneaky,
   EvilProxy) -- one of these may power Stage 3.
3. If matched, add the relevant Sekoia tier_1 post as a co-citation to
   T1539.draft.yaml and update _mapping_confidence to high.
4. Resolve all UNKNOWN telemetry fields against MS Learn and the tier_1 source.
