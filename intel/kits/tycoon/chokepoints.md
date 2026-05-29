# tycoon -> chokepoint mapping

Chokepoint IDs resolved from detection-chokepoints draft output (2026-05-27).
Draft paths are under `drafts/` — promotion to `chokepoints/` is a separate human step.

| Step | T-ID      | Behavior                                     | Chokepoint slug                | Draft URL (pre-promotion)                                                                                  | Confidence |
|------|-----------|----------------------------------------------|--------------------------------|------------------------------------------------------------------------------------------------------------|------------|
| 1a   | T1539     | AiTM relay cookie capture (generic)          | aitm-websocket-relay           | https://iimp0ster.github.io/detection-chokepoints/drafts/credential-access/aitm-websocket-relay            | H          |
| 1b   | T1539     | Kit relay Node.js UA sign-in (Elastic 2026)  | aitm-websocket-relay           | https://iimp0ster.github.io/detection-chokepoints/drafts/credential-access/aitm-websocket-relay            | H          |
| 2a   | T1550.001 | Refresh token pivot (FOCI to EXO)            | aitm-websocket-relay           | https://iimp0ster.github.io/detection-chokepoints/drafts/credential-access/aitm-websocket-relay            | H          |
| 2b   | T1550.001 | Device-code-grant phishing via MAB app ID    | oauth-device-code-phishing     | https://iimp0ster.github.io/detection-chokepoints/drafts/defense-evasion/oauth-device-code-phishing        | H          |
| 3    | T1098.005 | Synthetic device registration + PRT chain    | aitm-device-prt-enrollment     | https://iimp0ster.github.io/detection-chokepoints/drafts/persistence/aitm-device-prt-enrollment            | H          |
| 4    | T1087.004 | 5-category Graph recon burst (operator)      | graph-api-recon-burst          | https://iimp0ster.github.io/detection-chokepoints/drafts/discovery/graph-api-recon-burst                   | H          |
| 5    | T1114.002 | MailItemsAccessed mailbox read               | CP-TODO (no draft yet)         | CP-TODO                                                                                                    | M          |
| 6    | T1114.003 | Inbox rule for exfil persistence             | CP-TODO (no draft yet)         | CP-TODO                                                                                                    | M          |

## Detection signal notes

### T1539 -- Tycoon-specific relay tells (NOT present in lab stub)
The relay step surfaces three cross-kit tells that are absent from the lab
cookie-replay substitute:
1. **UA anomaly** -- relay hardcodes a Chrome/Windows UA on the datacenter
   IP rather than the victim's real UA. `entra_signin.userAgent` mismatch
   between the phishing-page load and the signed-in session.
2. **ASN anomaly** -- signin from AS9009 (MLWEB) or AS29802 (HVC-AS); unusual
   for consumer OfficeHome traffic.
3. **appId consistency** -- OfficeHome `4765445b-32c6-49b0-83e6-1d93765276ca`
   for virtually all Tycoon sessions.
These signals require a live relay or replay traffic simulation; the lab stub
does not exercise them.

### T1550.001 -- FOCI pivot tell
`entra_signin.authenticationProtocol: refreshToken` on a new ResourceDisplayName
within minutes of the initial cookie signin. Correlation with a prior T1539
signin on the same account is the high-signal composite.

### T1114.003 -- Inbox rule chokepoint
`New-InboxRule` in UAL is a high-fidelity signal. Rule names containing
financial keywords (invoice, wire, payment) or forwarding to external freemail
addresses elevate confidence. Persistence: rule survives password reset.
