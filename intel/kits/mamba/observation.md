# mamba observation -- 2026-05-17

## Kit identification

Identified via Sekoia TDR blog post published 2024-10-09 (tier_1):
"Mamba 2FA: A new contender in the AiTM phishing ecosystem"
https://blog.sekoia.io/mamba-2fa-a-new-contender-in-the-aitm-phishing-ecosystem/

URLScan query from skill library (last_validated 2025-06):
```
page.url:/.*\/(o|r|s)\/\?(c3Y9bzM2NV|aXBkYXRhP).*/ OR task.url:*socket.io/?EIO=4*
```

**Fingerprinting signals (from Sekoia):**

URL structure:
- `https://{domain}/{m,n,o}/?{Base64-blob}`
- Example path characters: `m`, `n`, `o`
- Base64 blob decodes to: `sv=o365_#_nom&rand=<b64>&uid=<customer-id>`
- Email injected as URL fragment separator `N0123N` or `#`

JavaScript artifacts:
- Socket.IO CDN: `https://cdn.socket.io/4.7.5/socket.io.min.js`
- Template scripts: `jsdrive.js`, `jsnom.js`, `jssp.js`, `jsv.js`
- HTML attributes: `sti='<double-b64-customer-id>'`, `vic='{target-email}'`

Socket.IO events (client → server):
- `new-session`: params `uid`, `email`, `ua`, `timeZone`, `browserLanguage`
- `password_command`: param `password`
- `otp_command`: param `phish_otp`

Socket.IO events (server → client):
- `s2c`: `phish_state` values `RQ_EMAIL`, `RQ_PASSWORD`, `RQ_OTP_NOPASS_APP`,
  `RQ_OTP_APP`, `RQ_OTP_APP_CODE`, `RQ_OTP_PHONE`
- `s2c_cookies`: signals capture completion; includes `endUrl` redirect target
- `s2c_restart`: timeout/error

Infrastructure:
- Relay servers: IPv6 block `2607:5500:3000::/48` (consistent through Aug–Oct 2024)
- Residential proxies: IPRoyal (defeats ASN-based detection; adopted Oct 2024)
- HTML attachments hosted on Cloudflare R2 or IPFS
- PhaaS model: $250 / 30 days; Telegram subscription channel
- Link domains rotated weekly; relay domains last several weeks


## Post-auth behaviors observed

The Sekoia post describes the **pre-auth relay phase only**. Post-auth
behaviors (what the kit operator does with the captured session) are not
documented in this specific report.

Explicitly documented:
1. Captured credentials + session cookies exfiltrated to operator via Telegram bot.
2. Victim redirected to `endUrl` after `s2c_cookies` event fires.

Behaviors in existing `rigs/mamba.yaml` (T1528, T1550.001, T1213.002,
T1534) are typical post-AiTM campaign actions but are NOT grounded by this
Sekoia post. They require separate citation before promotion.


## Lab-safe primitive vs. observed TTP

**T1539 — AiTM session-cookie capture:**
Mamba captures session cookies via a real-time synchronous Socket.IO relay
that proxies the victim's Microsoft login. Tacklebox does not stand up a
relay server. The T1539 draft emulates cookie capture by performing an
interactive signin from a Tacklebox client and persisting the resulting
session cookie to disk. The UA-anomaly and source-IP (relay ASN) telemetry
signals are absent in the lab execution; the atomic exercises the downstream
cookie-replay signal only.

**T1111 — MFA relay interception:**
Mamba relays OTP codes and authenticator app push notifications in real
time via the `otp_command` Socket.IO event. Tacklebox has no mechanism to
relay live MFA challenges to a victim. The T1111 draft is a stub only;
the executor throws "needs lab replay" until a fixture approach is designed.
The telemetry shape (sign-in completing with relayed OTP, no MFA method
change) requires a live MFA challenge and cannot be approximated in isolation.


## Sources consulted

### Tier 1
- Sekoia TDR, "Mamba 2FA: A new contender in the AiTM phishing ecosystem",
  2024-10-09
  https://blog.sekoia.io/mamba-2fa-a-new-contender-in-the-aitm-phishing-ecosystem/

- Sekoia TDR, "Global analysis of Adversary-in-the-Middle phishing threats",
  June 2025
  https://blog.sekoia.io/global-analysis-of-adversary-in-the-middle-phishing-threats/
  (cross-kit relay detection patterns; local snapshot intel/snapshots/2025-06-sekoia-global-aitm/)


## Open questions

1. What specific Microsoft appId does Mamba target? Skill library notes
   "OfficeHome" for most PhaaS but this post does not confirm. Verify via
   URLScan hits against known Mamba domains.
2. Does Mamba have post-auth automation (inbox rules, device registration)?
   Not described in this Sekoia post. Check for a Part 2 or follow-on report.
3. T1111 executor: design a lab fixture approach for relayed MFA replay
   before promotion (e.g., TOTP seed injection in lab tenant).
4. Are the existing mamba rig steps (T1528, T1550.001, T1213.002, T1534)
   grounded in any tier_1 source specific to Mamba? Need citation audit
   before they can be co-located in a promoted rig.
