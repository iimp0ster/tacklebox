# sneaky -> chokepoint mapping

Grounded by Sekoia TDR "Sneaky 2FA: Exposing a new AiTM Phishing-as-a-Service".
Post-auth chokepoints not included (no post-auth behavior documented in source).

| Step | T-ID  | Behavior                               | Chokepoint | URL                                                                        | Confidence |
|------|-------|----------------------------------------|------------|----------------------------------------------------------------------------|------------|
| 1    | T1539 | AiTM session-cookie capture            | CP-TODO    | https://iimp0ster.github.io/detection-chokepoints/CP-TODO                  | H          |
| 2    | T1111 | MFA relay interception (SAS endpoints) | CP-TODO    | https://iimp0ster.github.io/detection-chokepoints/CP-TODO                  | H          |

## Detection context per step

### Step 1 -- T1539 (cookie capture) -- "impossible device shift"

The primary Sneaky 2FA detection signal is documented explicitly in the
Sekoia source as a Sigma correlation rule. It is distinct from all other
kits in this tree.

**Wild-capture signal (from Sekoia Sigma rule -- verbatim UAs):**

Within the same `correlationId`, within 10 minutes:

```
Event A (Login:login step):
  user_agent.original: "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X)
    AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1"

Event B (Login:resume step):
  user_agent.original: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)
    AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0"
```

Detection logic: alert when same `correlationId` has both UA patterns within 10 minutes.
Field mapping: Sigma uses `office365.auth.request_type` and `user_agent.original` (ECS).
Entra-native field names require MS Learn verification before promotion.

**Lab substitute signal:** none of the above; interactive signin produces real user UA.

### Step 2 -- T1111 (MFA relay)

**Wild-capture signal:**
- SAS RequestType sequence (Login:login → SAS:BeginAuth → SAS:ProcessAuth →
  SAS:EndAuth → Kmsi:kmsi) under same correlationId, authentication SUCCEEDS.
- No MFA failure event -- the relay forwards a valid live response.
- The combination of: impossible-device-shift UA (Step 1) + successful MFA + relay-
  origin IP is the full detection chain.

**Lab substitute signal:** none (stub executor); validate field names via MS Learn.

## Kit-specific notes

**Direct-API architecture vs. proxy-relay kits:**
Sneaky 2FA is NOT a transparent proxy. It calls Microsoft APIs from the
phishing server with hardcoded UAs. This means:
- ASN-based detection (relay-server IP) may still apply (phishing server IP
  visible in sign-in log) -- but kit is deployed on compromised WordPress sites,
  so IP profile varies widely.
- The UA-incoherence signal is more reliable and kit-specific.

**Code lineage:** Sneaky 2FA is based on W3LL OV6 (May–June 2023). W3LL Panel
(CEPHAS) is separately tracked. Any Sneaky-specific post-auth behavior
discovered may share traits with W3LL Panel post-auth patterns.
