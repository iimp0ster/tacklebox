# sneaky observation -- 2026-05-17

## Kit identification

Identified via Sekoia TDR blog post (tier_1):
"Sneaky 2FA: Exposing a new AiTM Phishing-as-a-Service"
https://blog.sekoia.io/sneaky-2fa-exposing-a-new-aitm-phishing-as-a-service/
(Active since October 2024; discovered December 2024; ~100 domains by Jan 2025)

URLScan query from skill library (last_validated 2025-06):
```
page.url:/.*\/[a-zA-Z0-9]{120,170}\/(index|verify|validate)$/ AND
page.title:("Verify your account" OR "Verify your identity" OR "Confirm your login"
            OR "Signin to your account")
```

**Fingerprinting signals (from Sekoia):**

URL structure:
- Path: `/<150-alphanumeric-chars>/(index|verify|validate)`
- Example: `/n/uswDOVS70y9sjyP...xgdEFzj2mVBzwSbpe5c/validate`
- Email autograb: `/#victim@example.com` or base64-encoded in fragment

HTML/JS markers:
- Initial page presents food-related decoy content ("Gourmet Delights") behind
  Cloudflare Turnstile, then redirects via `window.location.reload()`
- HTML comment: `<!-- Food Section -->` (decoy page marker)
- Microsoft favicon: base64-encoded, SHA256
  `5d91563b6acd54468ae282083cf9ee3d2c9b2daa45a8de9cb661c2195b9f6cbf`
- HTML text obfuscation via empty anchor tags:
  `N<a class="kzoNmrYqOS"></a>o a<a class="kzoNmrYqOS"></a>cc...`
- Fake page titles randomly selected (Sekoia lists several variants)
- Anti-debugging techniques present

Backend licensing:
- `hxxps://sneakylog[.]store/api/key`
- `hxxp://185.125.100[.]81/api/key`

Victim credential submission endpoint:
- POST `/[a-zA-Z0-9]{150}/validate`
  params: `em=<email>&pa=<password>` or `em=<email>&auth=<2fa_method>&code=<otp>`

Microsoft API relay endpoints proxied by phishing server:
- POST `/login`
- POST `/SAS/BeginAuth`
- POST `/SAS/ProcessAuth`
- POST `/SAS/EndAuth`
- POST `/kmsi`

**Architecture distinction (from Sekoia):**
Unlike Mamba 2FA (Socket.IO proxy) or EvilProxy (full HTTP proxy), Sneaky 2FA
communicates with the Microsoft 365 API DIRECTLY from the phishing server
rather than acting as a transparent relay. The phishing server makes API calls
using hardcoded UA strings that differ per authentication step. This produces
the "impossible device shift" detection signal.

**Code lineage:**
Based on the W3LL OV6 phishing kit (May–June 2023 version); shares identical
background images and Microsoft authentication relay code. W3LL Panel is
separately tracked in the skill's URLScan query library.

**PhaaS model:**
$200/month; customers deploy obfuscated code on their own infrastructure
(WordPress sites or attacker-controlled domains). Telegram: @SneakyLog_bot
(sales), @SneakySupport_bot (support).


## Post-auth behaviors observed

The Sekoia post documents the **pre-auth relay phase only**. No post-auth
operator actions (inbox rules, device registration, token abuse, BEC, etc.)
are described. Post-auth behavior drafts require a separate source.

Explicitly documented:
1. Session cookie harvested to "bypass the MFA process during subsequent
   authentication." Cookie exfiltration mechanism to operator is not detailed
   (no Telegram bot mentioned for this kit, unlike Mamba).
2. Credentials captured via POST to `/validate` with `em` and `pa` params.


## Lab-safe primitive vs. observed TTP

**T1539 — AiTM session-cookie capture:**
Sneaky 2FA relays Microsoft API calls directly from its phishing server
(not via a transparent proxy). The server uses different hardcoded UA strings
at each authentication step, producing an "impossible device shift" (iOS Safari
on Login:login, Windows Edge on Login:resume) within the same correlation ID.
Tacklebox does not stand up a relay. The T1539 draft emulates cookie capture
via interactive roadtx signin. The impossible-device-shift UA telemetry is
ABSENT in the lab substitute; what can be validated is the cookie-replay
downstream shape only.

**T1111 — MFA relay (2FA interception):**
Sneaky 2FA intercepts Microsoft Authenticator, OTP, and SMS 2FA by relaying
SAS BeginAuth/ProcessAuth/EndAuth. Tacklebox has no relay fixture. T1111 draft
is a stub only; same open question as mamba/T1111.


## Sources consulted

### Tier 1
- Sekoia TDR, "Sneaky 2FA: Exposing a new AiTM Phishing-as-a-Service", 2025
  https://blog.sekoia.io/sneaky-2fa-exposing-a-new-aitm-phishing-as-a-service/

- Sekoia TDR, "Global analysis of Adversary-in-the-Middle phishing threats",
  June 2025
  https://blog.sekoia.io/global-analysis-of-adversary-in-the-middle-phishing-threats/
  (cross-kit relay detection patterns; local snapshot intel/snapshots/2025-06-sekoia-global-aitm/)


## Open questions

1. What appId does Sneaky 2FA target? Not stated in this post. Most PhaaS kits
   target OfficeHome (`4765445b-32c6-49b0-83e6-1d93765276ca`) -- verify via
   URLScan hits on known Sneaky 2FA domains.
2. How does Sneaky 2FA exfil captured cookies to the operator? Telegram bot
   (@SneakyLog_bot) is mentioned for sales/licensing but not for cookie delivery.
   Confirm exfil channel before drafting a T1567 atomic.
3. T1111 executor: same open question as mamba -- design a lab fixture approach
   for relayed MFA replay (see intel/kits/mamba/observation.md open question #3).
4. W3LL OV6 code lineage: does this mean Sneaky shares post-auth behaviors
   with W3LL Panel (CEPHAS)? Check if a W3LL TTP write-up exists to cross-cite.
5. Does Sneaky 2FA have post-auth automation, or is it operator-manual after
   cookie delivery? Not described in this post.
