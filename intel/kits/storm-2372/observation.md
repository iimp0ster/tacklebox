# storm-2372 observation -- 2026-05-20

## Kit identification

Storm-2372 is a Russian-aligned threat actor (Microsoft: moderate confidence) that
conducts device-code phishing campaigns targeting government, NGOs, defense,
telecom, health, higher education, and energy sectors across Europe, North America,
Africa, and the Middle East.

Unlike synchronous reverse-proxy AiTM kits (Tycoon, Mamba, EvilProxy), Storm-2372
abuses the OAuth 2.0 device authorization grant flow natively -- no relay
infrastructure is required. The actor generates a device code, embeds it as a
fake "meeting ID" in a Teams meeting invitation or messaging-platform lure, and
waits for the victim to visit `microsoft.com/devicelogin` and enter the code.
Upon victim authentication the actor captures the resulting access and refresh
tokens directly from the device-code polling endpoint.

### Campaign evolution (Feb 2025)

As of 14 February 2025, Storm-2372 shifted from generic client IDs to the
Microsoft Authentication Broker client ID, enabling Primary Refresh Token (PRT)
generation after attacker-controlled device registration. This post-Feb-14
technique produces more durable persistence and is tracked separately as T1098.005.

### Initial contact vectors

Storm-2372 uses Signal, WhatsApp, and messaging platforms alongside Teams meeting
invitation lures. Volexity (UTA0352/UTA0355, Russian medium confidence) observed
initial contact via compromised Ukrainian government email accounts impersonating
European officials scheduling meetings. The Visual Studio Code client ID
(`aebc6443-996d-45c2-90f0-388ff96faa56`) and redirect URI
`https://insiders.vscode.dev/redirect` have been fingerprinted in UTA0352
campaigns, which overlap with the Storm-2372 device-code technique.

### Proxy usage

"The actor has also been observed to use proxies that are regionally appropriate
for the targets" (Microsoft TI). This distinguishes Storm-2372 from datacenter-ASN
patterns characteristic of relay-based kits.

## Post-auth behaviors observed

1. **Device-code OAuth token capture** (T1078.004) — actor polls the device code
   endpoint until the victim completes authentication, then captures access and
   refresh tokens. Microsoft TI verbatim: "capture the authentication—access and
   refresh—tokens that are generated, then use those tokens to access the
   target's accounts and data."

2. **Graph keyword search across victim messages** (T1087.004) — actor uses
   Microsoft Graph to search message content for targeted keywords: "username,
   password, admin, teamviewer, anydesk, credentials, secret, ministry, gov"
   (Microsoft TI verbatim). Exact Graph API endpoint not specified in available
   sources; behavior attributed to Storm-2372 at medium confidence.

3. **Remote email exfiltration via Graph** (T1114.002) — emails identified via
   keyword search are exfiltrated using Microsoft Graph. Microsoft TI verbatim:
   "Email exfiltration via Microsoft Graph of the emails found from these searches."
   Exact Graph endpoint not specified; medium confidence.

4. **Intra-org lateral phishing** (T1566.002 re-entry) — actor sends device-code
   phishing emails to other users in the victim's organization using the
   compromised account, extending the campaign internally. Lure delivery mechanism
   is the same as the initial spearphishing step.

5. **Device registration for PRT-based persistence** (T1098.005, post-Feb 14) —
   actor registers an attacker-controlled device to the victim's Entra ID tenant
   using the Microsoft Authentication Broker client ID, enabling PRT generation.
   Volexity (UTA0355) corroborates: client_id `29d9ed98-a469-4536-ade2-f981bc1d605e`,
   Device Registration Service resource `01cb2876-7ebd-4aa4-9cc9-d28bd4d359a9`.
   Subsequent access shows Microsoft IP addresses (not attacker) due to registered
   device, complicating attribution.

## Entra / sign-in telemetry

From Microsoft TI (verbatim):
- ErrorCode 50199 (pause for user code entry) followed by ErrorCode 0 (success)
- RiskEventType: anonymizedIPAddress, investigationsThreatIntelligence
- RiskLevelDuringSignIn: 10, 50, or 100

## Lab-safe primitive vs. observed TTP

**T1566.002 — lure delivery.** Storm-2372 delivers lures via Teams meeting
invitations, Signal, WhatsApp, and email. The lab substitute uses a Graph-sent
internal phishing message. The external-platform lure vectors (Signal/WhatsApp)
are outside Microsoft cloud telemetry scope and cannot be exercised in a lab
tenant. The Teams meeting invitation shape (device code embedded as meeting ID)
is approximated by Graph-delivered message only.

**T1078.004 — device-code token theft.** The production Tacklebox atomic at
`atomics/T1078.004-device-code/T1078.004-device-code.yaml` is the correct
production target and is TTP-accurate for this campaign. The rig wires steps
sequentially via `requires_token_from`.

**T1098.005 — device registration.** The post-Feb-14 evolution requires the
Microsoft Authentication Broker client ID. Lab execution requires careful
scoping; the atomic stub gates on the roadtx dependency. Token produced by
T1078.004 feeds this step. Volexity independently confirms device registration
behavior for the UTA0355 cluster.

## Sources consulted

- Tier 1:
  - Microsoft Threat Intelligence: https://www.microsoft.com/en-us/security/blog/2025/02/13/storm-2372-conducts-device-code-phishing-campaign/
- Tier 2:
  - Volexity: https://www.volexity.com/blog/2025/04/22/phishing-for-codes-russian-threat-actors-target-microsoft-365-oauth-workflows/
  - Proofpoint: https://www.proofpoint.com/us/blog/threat-insight/access-granted-phishing-device-code-authorization-account-takeover

## Promotion notes

| Draft file | Production target |
|------------|------------------|
| atomics/T1566.002.draft.yaml | atomics/T1566.002-internal-phishing/T1566.002-internal-phishing.yaml |
| atomics/T1078.004.draft.yaml | atomics/T1078.004-device-code/T1078.004-device-code.yaml |
| atomics/T1087.004.draft.yaml | atomics/T1087.004-graph-enumeration/T1087.004-graph-enumeration.yaml |
| atomics/T1114.002.draft.yaml | atomics/T1114.002-mail-items-accessed/T1114.002-mail-items-accessed.yaml |
| atomics/T1098.005.draft.yaml | atomics/T1098.005-device-registration-prt/T1098.005-device-registration-prt.yaml |

## Open questions

1. **Exact Graph /messages endpoint for keyword search** — Microsoft TI states
   Graph-based message search with named keywords but does not cite the specific
   API path (e.g., `/search/query`, `/users/{id}/messages?$search=`). Medium
   confidence only until a per-source confirmation is obtained.

2. **Exact Graph endpoint for email exfiltration** — "Email exfiltration via
   Microsoft Graph" is stated without a specific endpoint. May be the same
   `/users/{id}/messages` list or a `/search/query` bulk result. Verify against
   DFIR case data or Microsoft investigation notes at promotion.

3. **UTA0352 / UTA0355 exact overlap with Storm-2372** — Volexity tracks these
   as separate clusters with Russian attribution at medium confidence. Microsoft
   tracks Storm-2372 separately. Whether these are the same actor or a shared
   technique is unresolved.

4. **Regional proxy infrastructure details** — Microsoft TI notes regionally
   appropriate proxies but no ASN or hosting provider specifics are cited.
   Infrastructure fingerprinting is not available from tier-1 sources at this time.

5. **OAuth authorization code lifetime** — Volexity states codes valid up to
   60 days for UTA0352. Applicability to Storm-2372 device codes (which have a
   15-minute expiry by default) versus OAuth authorization codes (used in the
   UTA0352 VSCode client variant) should be clarified at promotion.
