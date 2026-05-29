# tycoon observation -- 2026-05-18

## Kit identification

Tycoon 2FA is a synchronous reverse-proxy AiTM PhaaS kit sold on Telegram.
Fingerprinted via the following URLScan query (validated 2025-06):

```
page.url:*/auth/* AND filename:"*.js" AND NOT page.domain:microsoftonline.com
```

Hit shape:
- Domain pattern: `[a-z0-9]{2,6}\.[a-z]{5,15}\.(ru|com|es|cc|info|su|vip)`
- URL path: `/{4-15-char slug}/?em=<victim-email>`
- App ID targeted: `4765445b-32c6-49b0-83e6-1d93765276ca` (OfficeHome)
- ASN preferences: AS9009 (MLWEB), AS29802 (HVC-AS) -- datacenter, not residential
- JS served at `*/auth/*.js`; relay hardcodes a Chrome/Windows UA rather than
  forwarding the victim's UA (synchronous-relay tell #1)

Attribution: Microsoft-named threat actor Storm-XXXX (see open questions).
Kit sold via Telegram bot; phishing lure pages use 2captcha for CAPTCHA gating.

Sources: Sekoia global AiTM analysis (June 2025); Microsoft TI Inside Tycoon2FA
(March 2026); URLScan query library in skill SKILL.md.

## Post-auth behaviors observed

1. **Session cookie capture** (T1539) — relay intercepts ESTSAUTH and
   ESTSAUTHPERSISTENT cookies from the victim's authenticated session after
   MFA completion. The relay backend forwards cookies to the operator panel.

2. **Refresh token pivot** (T1550.001) — operator uses the captured session
   material (access + refresh token pair) to request tokens for additional
   Microsoft cloud resources via FOCI (Family of Client IDs). Observed pivots:
   Graph → Exchange Online / Outlook.

3. **Graph API enumeration** (T1087.004) — post-session-capture operator
   queries `/me`, `/users`, `/organization` to identify the victim's role,
   tenant size, and enumerate targets for follow-on BEC or data access. Pattern
   consistent with synchronous-relay kit operator playbook per Sekoia global
   analysis; Tycoon-specific confirmation needed (medium confidence).

4. **MailItemsAccessed mailbox read** (T1114.002) — Graph API `GET /users/{id}/messages`
   access to victim mailbox generates MailItemsAccessed events in UAL.
   Documented as standard operator action after Tycoon session capture.

5. **Inbox rule for persistent exfiltration** (T1114.003) — operator creates
   server-side inbox rule via Graph `POST /users/{id}/mailFolders/inbox/messageRules`
   to forward keyword-matching mail. Persistence survives password reset unless
   explicitly remediated.

## Lab-safe primitive vs. observed TTP

**T1539 — AiTM relay substitution.** Tycoon 2FA captures session cookies via a
live synchronous reverse-proxy relay: the victim browses the phishing page, Tycoon
proxies every request/response to `login.microsoftonline.com`, and intercepts
ESTSAUTH/ESTSAUTHPERSISTENT cookies after MFA completion. Tacklebox does not
stand up a relay; `T1539-cookie-replay` substitutes by injecting a pre-captured
lab session cookie via `roadtx getcookies`. The telemetry shape differs: the
relay path produces `authenticationProtocol: none` with an anomalous hardcoded
UA on a datacenter ASN; the lab stub produces a clean session. The
synchronous-relay UA and ASN tells (cross-kit detection pattern #1 and #3) are
**absent** from the lab stub and must be exercised separately if detection
coverage for those specific signals is required.

**Production rig divergence.** The existing `rigs/tycoon.yaml` uses
`T1078.004-device-code` as step 1. Device-code phishing is a *different*
attack vector (the victim authenticates via `microsoft.com/devicelogin`)
and is **not** how Tycoon 2FA operates in the wild. The lab rig uses device-code
as a convenient token-theft substitute that is atomic-testable without a relay.
This draft rig documents the TTP-accurate chain (T1539 relay → T1550.001 →
T1087.004 → T1114.002 → T1114.003). At promotion, the human reviewer should
decide whether to update the production rig to the TTP-accurate chain or keep
the device-code approximation with a documented caveat.

## Sources consulted

- Tier 1:
  - Sekoia TDR: https://blog.sekoia.io/global-analysis-of-adversary-in-the-middle-phishing-threats/ (June 2025)
  - Sekoia TDR: https://blog.sekoia.io/tycoon-2fa-an-in-depth-analysis-of-the-latest-version-of-the-aitm-phishing-kit/ (March 2024 -- Tycoon-specific in-depth analysis)
  - Microsoft Threat Intelligence: https://www.microsoft.com/en-us/security/blog/2026/03/inside-tycoon2fa-adversary-in-the-middle-phishing-kit/ (March 2026 -- verify URL slug)
- Tier 2:
  - ANY.RUN: https://any.run/cybersecurity-blog/salty2fa-tycoon2fa-hybrid-phishing-2025/ (Nov 2025 -- Salty2FA/Tycoon2FA hybrid collapse and kit evolution)
- Canonical docs:
  - Microsoft Learn (appId verification, MailItemsAccessed event schema)

## Open questions

1. **Storm actor number** -- Microsoft TI names a Storm-XXXX actor for Tycoon
   2FA operations. Exact number not confirmed from available sources; leave as
   `<UNKNOWN -- verify against Microsoft TI post>` in atomic storm_attribution
   claims until the exact post is reviewed.

2. **Post-auth API paths** -- Specific Graph API endpoints used by Tycoon
   operators (beyond `/me` and `/users`) are inferred from the operator playbook,
   not explicitly listed in available sources. Medium confidence only on T1087.004.

3. **Kit internals for inbox rule creation** -- The exact Graph endpoint path
   (`/mailFolders/inbox/messageRules`) is from Microsoft Learn, not a Tycoon-
   specific source. The behavior (inbox rule creation) is attributed to Tycoon
   by Microsoft TI but the exact method used by operators may differ.

4. **Version drift** -- Tycoon 2FA has been evolving continuously (phishing page
   updates, new evasion techniques). Sources are anchored to June 2025 (Sekoia)
   and March 2026 (Microsoft TI). Kit behavior may have changed after those
   publication dates.
   ANY.RUN (Nov 2025) documents hybrid Salty2FA→Tycoon2FA fallback; Storm-1747 hypothesised as operator of both. Salty2FA infrastructure collapsed Nov 1 2025.

5. **Storm-1747 confirmation** -- ANY.RUN hypothesises Storm-1747 operates both Salty2FA and Tycoon2FA. Microsoft TI attribution post for Tycoon not yet confirmed (open question #1). Cross-reference if Microsoft TI names Storm-1747 in the Inside Tycoon2FA post.

---

## Elastic Security Labs addendum (2026-05-27)

Source: https://www.elastic.co/security-labs/tycoon-2fa-aitm-detection-engineering (tier_1)

This addendum documents new behaviors, fingerprints, and IR observations surfaced by Elastic
Security Labs not covered in the prior sources. All claims grounded in this single tier_1 source.

### New fingerprints

- **Socket.IO event typo**: `recieveid` (misspelled) — consistent across Tycoon 2FA variants.
  Persistent kit fingerprint; survives kit version updates.
- **CryptoJS 4.2.0 with hardcoded AES-CBC key**: `1234567890123456` — static in kit JS source.
- **Node.js HTTP client UAs**: `axios/1.15.2`, `node-fetch/1.0`, `undici` (versioned, not generic).
- **Microsoft Authentication Broker client ID**: `29d9ed98-a469-4536-ade2-f981bc1d605e` —
  hardcoded in device-code-grant variant.
- **Google Chrome OAuth client ID**: `77185425430.apps.googleusercontent.com` — used in
  Google Workspace relay variant.
- **Fake CAPTCHA**: 3×3 Unsplash-sourced image grid replacing Cloudflare Turnstile.
- **Bot detection strings**: `navigator.webdriver`, `window.callPhantom`, `window._phantom`,
  `Burp` in user-agent — kit bails out silently if detected.
- **Linux desktop fingerprint**: kit writes empty string for Linux UA — assumes Linux = security
  researcher.

### New behaviors (added to kit atomics)

6. **Node.js UA relay sign-in** (T1539, new variant) — kit's Tier 1 relay makes server-to-server
   HTTP calls to Microsoft sign-in endpoints using Node.js UAs. Entra ID logs show a successful
   sign-in with `userAgent: axios/1.15.2` (or `undici`) on OfficeHome/Auth Broker/Graph apps.
   This is the Tier 1 cloud-VPS sign-in event. Added as new variant in T1539.draft.yaml.

7. **Device-code-grant phishing** (T1550.001, new variant) — post-takedown adaptation. Kit
   requests device code via MAB client ID `29d9ed98-...`, delivers to victim as "verification
   code." Bypasses URL-filtering (no phishing page). Yields FOCI Auth Broker refresh token.
   Token progression: `incomingTokenType: none → refreshToken → primaryRefreshToken`.
   Added as new variant in T1550.001.draft.yaml.

8. **DRS device enrollment for PRT persistence** (T1098.005, new draft) — kit registers a
   synthetic device via `https://enterpriseregistration.windows.net/EnrollmentServer/device`
   using a resource-swapped DRS access token. UA is `axios/1.15.2`, not native Dsreg.
   Resulting PRT survives `revokeSignInSessions`. Critical IR gap: standard playbooks that
   execute revoke without device deletion leave the PRT valid.
   Correct IR sequence: disable account → enumerate + delete registered devices →
   revokeSignInSessions → reset password.
   NEW draft: T1098.005.draft.yaml.

9. **Two-tier ASN infrastructure** (T1539, architectural note) — Tier 1 (cloud-VPS ASN:
   Alibaba Cloud AS37963, M247 AS9009, DigitalOcean AS14061, Linode AS63949, OVH AS16276,
   Hetzner AS24940, Clouvider AS62240, Host Telecom) for kit relay; Tier 2 (residential proxy
   ASN) for operator console, appearing 10-20 minutes after Tier 1. Both tiers authenticate
   as the same UPN — the two-tier ASN correlation is the high-confidence analyst rule.

10. **5-category Graph API recon burst** (T1087.004, upgraded variant) — operator console
    executes 20-30+ Graph calls across role discovery / cross-tenant / mailbox / contacts /
    org-licensing within 30-60 seconds. Prior draft covered 3 endpoints at medium confidence;
    new variant covers all 5 Elastic-documented categories at high confidence with timing
    constraints. Empty `c_DeviceId` and `/beta/` disproportionate usage are secondary signals.
    c_sid is NOT the user object ID — pivot via source IP + appId.
    Added as high-confidence variant in T1087.004.draft.yaml.

### Google Workspace relay (4-event 1-second sequence)

Tycoon 2FA also relays Google Workspace authentication:
1. `login_success` — T+0.000s
2. `login_verification` (is_second_factor: true) — T+0.000s
3. `token: authorize` with Google Chrome OAuth client `77185425430.apps.googleusercontent.com` — T+0.4–0.6s
4. `DEVICE_REGISTER_UNREGISTER_EVENT` — T+0.6–1.2s

The 4-event sequence compressed to <1 second is mechanically impossible for human interaction.
Not yet drafted as a Tacklebox atomic — requires Google Workspace log source not in current scope.
