# storm-2372 -> chokepoint mapping

All chokepoint IDs are CP-TODO pending resolution against the detection-chokepoints
project (https://iimp0ster.github.io/detection-chokepoints/). Update at promotion.

| Step | T-ID      | Behavior                                                    | Chokepoint | URL                                                            | Confidence |
|------|-----------|-------------------------------------------------------------|------------|----------------------------------------------------------------|------------|
| 1    | T1566.002 | Spearphishing link via Teams/messaging (device-code lure)   | CP-TODO    | https://iimp0ster.github.io/detection-chokepoints/CP-TODO     | M          |
| 2    | T1078.004 | Device-code OAuth token theft (access + refresh token)      | CP-TODO    | https://iimp0ster.github.io/detection-chokepoints/CP-TODO     | H          |
| 3    | T1087.004 | Graph keyword search across victim messages                 | CP-TODO    | https://iimp0ster.github.io/detection-chokepoints/CP-TODO     | M          |
| 4    | T1114.002 | Remote email collection via Microsoft Graph                 | CP-TODO    | https://iimp0ster.github.io/detection-chokepoints/CP-TODO     | M          |
| 5    | T1098.005 | Device registration to Entra ID via Auth Broker (PRT)       | CP-TODO    | https://iimp0ster.github.io/detection-chokepoints/CP-TODO     | M          |

## Detection signal notes

### T1566.002 -- Lure delivery
Storm-2372 embeds device codes as fake meeting IDs in Teams meeting invitations
and uses Signal/WhatsApp/email for initial contact. Lab stub uses Graph-sent
internal message. External-platform lures are outside Microsoft cloud telemetry
scope and cannot be exercised in a lab tenant.

### T1078.004 -- Device-code token theft
Primary detection surface: Entra sign-in log. ErrorCode sequence 50199 (pause
for user code entry) then 0 (success) is the authoritative signal sequence per
Microsoft TI. RiskEventType: anonymizedIPAddress, investigationsThreatIntelligence.
RiskLevelDuringSignIn escalates through 10/50/100. authenticationProtocol:
deviceCode is the protocol-level discriminator.

### T1087.004 -- Graph message keyword search
Graph-based message search generates Graph audit events. Specific keyword set
(username, password, admin, teamviewer, anydesk, credentials, secret, ministry,
gov) is verbatim from Microsoft TI and is a high-fidelity behavioral indicator
if observable at the Graph query level.

### T1114.002 -- Email exfiltration via Graph
MailItemsAccessed events in UAL (E5 required). ClientInfoString contains Graph
for API-driven access. Volume anomaly relative to baseline is the composite
signal; keyword-targeted access further elevates confidence.

### T1098.005 -- Device registration (post-Feb 14)
Device registration via Microsoft Authentication Broker
(appId 29d9ed98-a469-4536-ade2-f981bc1d605e) against Device Registration Service
(resource 01cb2876-7ebd-4aa4-9cc9-d28bd4d359a9) generates Entra audit events.
Subsequent access shows Microsoft IP addresses (not attacker) due to registered
device, complicating correlation. Unique deviceId values and anomalous ClientAppID
in logs are the detection anchors per Volexity.
