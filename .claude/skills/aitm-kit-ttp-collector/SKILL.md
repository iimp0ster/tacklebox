---
name: aitm-kit-ttp-collector
description: |
  Translate AiTM and device-code phishing kit observations into draft
  Tacklebox atomics + rigs. Hunts named kit families (Tycoon 2FA, Mamba 2FA,
  Sneaky 2FA, EvilProxy, FlowerStorm/ODx, ONNX, Greatness, Evilginx,
  EvilTokens, Kali365) via OSINT (URLScan, VirusTotal, Hunt.io, etc.) AND
  grounds post-auth procedures in tier-1 research (Sekoia, Microsoft TI, Push
  Security, SpecterOps, Dirk-Jan Mollema). Produces machine-readable draft
  artifacts under intel/kits/<kit-slug>/ for human promotion. Never writes
  to atomics/ or rigs/ directly. Use when triaging a suspect AiTM page,
  enriching an existing kit family with new procedures, or producing
  pipeline-ready intel on post-authentication behavior. Distinct from
  infra-malware-delivery-hunter (which hunts masquerading software delivery
  infrastructure, not credential harvest).
---

# aitm-kit-ttp-collector

Translate AiTM phishing-kit observations into Tacklebox draft atomics + rigs.
Output lands under `intel/kits/<kit-slug>/`. Promotion into runnable
`atomics/` and `rigs/` is a separate human step gated by schema validation,
UUID regeneration, citation grounding, and the lab-tenant rule.

## Hard rules

Inherited from `infra-malware-delivery-hunter`:

- Never make direct HTTP requests to adversary infrastructure.
- OSINT allowlist only: urlscan, VirusTotal, tria.ge, abuse.ch, Shodan,
  Censys, Hunt.io, Validin, WhoisXML/RDAP, `file:///snapshots`.
- Never download payloads or kit source.
- URLs inside OSINT results are *subjects*, not citation destinations -- do
  not fetch them.
- Thin intel is valid output. An empty atomic stub with a "needs lab replay"
  TODO is better than a fabricated executor.

Additions specific to this skill:

- Never write into `/atomics/` or `/rigs/`. Drafts go ONLY to
  `intel/kits/<kit-slug>/`. The repo's pre-commit hook
  (`tools/pre-commit-block-direct-writes.sh`) blocks commits to those
  directories that lack `[PROMOTE]` in the message.
- Every draft executor command MUST carry the banner comment:
  `# LAB TENANT ONLY -- Tacklebox.psm1 enforces at load`
- Every kit-internal claim, telemetry expectation, or MITRE T-ID mapping
  MUST carry a `_citations` entry that passes `tools/check_grounding.py`.
- Telemetry fields (`Operation`, `RecordType`, `appId`) MUST be either
  copied verbatim from a cited source OR set to the literal string
  `<UNKNOWN -- verify against MS docs>`. Never invented.

## Citation discipline

Every claim in a draft falls into one of the claim types defined in
`trusted_sources.yaml`. Each claim type has its own sufficiency gate:

| Claim type            | Required tier                                       | Rationale |
|-----------------------|-----------------------------------------------------|-----------|
| `kit_internals`       | tier_1 only                                         | Endpoint paths, backend code structure -- model-invention risk is high |
| `api_endpoints`       | tier_1 only                                         | Same as above |
| `token_flows`         | tier_1 only                                         | OAuth/PRT mechanics -- protocol-level |
| `entra_telemetry`     | tier_1 OR canonical (MS Learn)                      | appId / Operation / RecordType -- canonical docs are ground truth |
| `aitm_tradecraft`     | tier_1 OR two independent tier_2                    | Procedural details about relay logic |
| `campaign_attribution`| tier_1 OR two independent tier_2                    | Threat-actor naming, kit-to-actor mapping |
| `et_rules`            | Proofpoint (sole authority)                         | Proofpoint owns Emerging Threats |
| `email_obfuscation`   | tier_1 OR Sublime alone                             | Email-layer kit details |
| `mitigations`         | tier_1 OR two independent tier_2 OR MS Learn        | Conditional Access policy guidance |

The validator (`tools/check_grounding.py`) enforces this mechanically. This
prose describes the rule; the validator is what actually holds.

## MITRE technique mapping discipline

Every draft atomic carries `_mapping_confidence: low | medium | high`.

- `high` -- T-ID is directly stated in a tier_1 citation or is uncontested.
- `medium` -- T-ID is a reasonable interpretation from cited sources but not
  stated explicitly.
- `low` -- T-ID is the analyst's best guess; **requires** at least one tier_1
  citation in `_citations` (validator enforces).

Every atomic must also carry `_mapping_confidence_rationale`: a one-line
justification for the chosen value. The validator rejects an atomic that
sets `_mapping_confidence` without a non-empty rationale. This is a
forcing function against default-picking `medium` off the cookbook.

`low` confidence atomics are still draftable but flagged for explicit human
review before promotion.

## Translation loop

1. Identify the kit by fingerprint (URLScan / Sublime / Sekoia kit-fingerprint
   table below). Pick the `<kit-slug>` for `intel/kits/<kit-slug>/` using
   the **slug alignment rule**:
   - If `rigs/<candidate>.yaml` already exists for this kit, use the same
     stem (e.g. `tycoon`, not `tycoon-2fa`).
   - Else, if any `atomics/T*-<candidate-fragment>*` directories suggest a
     shared kit slug, align with that.
   - Else, coin a new lowercase slug matching `^[a-z0-9][a-z0-9-]*$`.

   This keeps the draft tree, eventual rig filename, and any consolidated
   `atomic_tests[]` entries on the same identifier.
2. Enumerate post-auth behaviors observable in the kit's backend or research
   grounding.
3. Map each behavior to a MITRE T-ID with `_mapping_confidence`.
4. Create or reuse a draft atomic per T-ID under
   `intel/kits/<slug>/atomics/T####.draft.yaml`. Drafts use bare T-ID
   filenames; promotion resolves the behavior slug (see promotion
   workflow). Check the production tree for an existing
   `atomics/T####-<behavior-slug>/` that matches; if one matches, plan to
   consolidate at promotion by appending to its `atomic_tests[]`. If no
   match, plan to create a new `atomics/T####-<behavior-slug>/` directory
   where `<behavior-slug>` describes the *behavior*, not the kit.
5. Order atomics into rig steps with `requires_token_from`.
6. Tag each step with chokepoint ID + URL.
7. Run `python tools/check_grounding.py --sources
   .claude/skills/aitm-kit-ttp-collector/trusted_sources.yaml
   intel/kits/<slug>/atomics/T*.draft.yaml`. Fail-loud.

## URLScan query library (AiTM-focused)

Each entry carries `last_validated: YYYY-MM-DD`. Queries older than 90 days
are stale -- reverify before use.

| Kit                       | Query                                                                                                                                                                                                                                                                                                  | Hit shape                                              | Confidence    | last_validated |
|---------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------|---------------|----------------|
| Tycoon 2FA                | `page.url:*/auth/* AND filename:"*.js" AND NOT page.domain:microsoftonline.com`                                                                                                                                                                                                                        | Domain regex `[a-z0-9]{2,6}\.[a-z]{5,15}\.(ru\|com\|es\|cc\|info\|su\|vip)`; autograb `/{4-15-char}/?em=<email>`; App ID `4765445b-32c6-49b0-83e6-1d93765276ca` (OfficeHome); ASs AS9009, AS29802 | high          | 2025-06        |
| Storm-1167 / FlowerStorm  | `task.url:*.cos.ap-*.myqcloud.com AND page.title:"Sign in to your Microsoft account"` OR `page.domain:*.it.com AND filename:"google.php"`                                                                                                                                                              | Tencent CDN `<bucket-appid>.cos.ap-<region>.myqcloud.com` hosts JS; exfil to `[0-9]{9,10}\.(cfd\|sbs\|xyz\|my\.id)/google.php`; ASs AS132203, AS19871 | high          | 2025-06        |
| Mamba 2FA                 | `page.url:/.*\\/(o\|r\|s)\\/\\?(c3Y9bzM2NV\|aXBkYXRhP).*/` OR `task.url:*socket.io/?EIO=4*`                                                                                                                                                                                                            | Autograb `<domain>/(o\|r\|s)/?(c3Y9bzM2NV\|aXBkYXRhP)<base64>N0123N<email>`; Socket.IO exfil; ASs IPRoyal proxies, Karolio IT | high          | 2025-06        |
| Sneaky 2FA                | `page.url:/.*\\/[a-zA-Z0-9]{120,170}\\/(index\|verify\|validate)$/` AND `page.title:("Verify your account" OR "Verify your identity" OR "Confirm your login" OR "Signin to your account")`                                                                                                             | URI pattern `/<uri>/[a-zA-Z0-9]{120-170}/(index\|verify\|validate)`; HTML `<!-- Food Section -->` indicator; ASs AS14061 (DigitalOcean) | high          | 2025-06        |
| EvilProxy                 | `page.url:/https:\\/\\/[a-f0-9]{32}\\..*/` AND `page.title:"reCAPTCHA: Click Allow to verify that you are not a robot"`                                                                                                                                                                                | Auth subdomain `[a-f0-9]{32}.<domain>`; older `(accounts\|0ffice\|0nline1\|l1ve).<domain>`; App ID `72782ba9-4490-4f03-8d82-562370ea3566` (Office365); ASs AS14061, AS63949 | high          | 2025-06        |
| NakedPages                | `page.url:*workers.dev*?qrc=* OR *workers.dev*?email=*` OR `page.url:*/ping/v5767687`                                                                                                                                                                                                                  | Initial CF Workers `workers.dev` or affiliate domain; reverse-proxy `aadcdn.msftauth.net/~/shared/1.0/content/.*`; final `/ping/v5767687`; App IDs OfficeHome + Office365 + EXO | high          | 2025-06        |
| Saiga 2FA                 | `page.url:*?S=*@*` AND `task.url:/.*\\/api\\/(config\|check-bot\|check-ip\|deets\|email\|login\|notice\|auth\|poll\|process\|kmsi)\\/$/`                                                                                                                                                               | Autograb `?S=<email>`; Next.js exfil endpoints `/api/{config,check-bot,...}/`; ASs AS36352, AS9009 | medium        | 2025-06        |
| Greatness                 | `page.url:/.*\\/s\\/[a-f0-9]{7,12}\\?[a-f0-9]{7,12}=.*/` OR `task.url:*upload.wikimedia.org*` AND `page.title:*sign in*`                                                                                                                                                                               | Path `/s/<hex7-12>?<hex7-12>=<email>`; WebSocket exfil `ws://...//p/[0-9]{3}?session=<hex64>`; resources from `upload.wikimedia.org`, `encrypted-tbn0.gstatic.com`; ASs PacketStream residential, AS16509 | high          | 2025-06        |
| Evilginx - ywnjb          | `page.url:*ywnjb.*` AND `task.url:*/common/oauth2/v2.0/authorize*`                                                                                                                                                                                                                                     | Phishlet `ywnjb` subdomain (= base64 `acc`); paths mirror Microsoft (`/common/oauth2/v2.0/authorize`, `/common/GetCredentialType`, `/common/SAS/BeginAuth`); Rick Astley YouTube redirect; ASs AS16509, AS14061 | high          | 2025-06        |
| Gabagool / Skyw4lker      | `page.url:*assets/php/endpoints/accounts.php*`                                                                                                                                                                                                                                                         | Exfil `POST <domain>/<folder>/assets/php/endpoints/accounts.php`; CF Turnstile "Browser security check in progress."; AS174 | medium        | 2025-06        |
| CEPHAS / W3LL Panel       | `page.url:/.*\\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\\/.*\\.php$/`                                                                                                                                                                                                             | Path `/<UUID>/`; endpoints `p5Qw9X8rN3.php`, `bR7sD9kJ2m.php`, `khL9kO2fV1.php`; central server AS202015 | medium        | 2025-06        |
| EvilTokens (device code)  | `page.domain:/(adobe\|page-adobe\|calendar_invite\|docusign\|page-docusign\|quarantine\|fax\|onedrive\|page-password\|sharepoint\|voicemail\|index)-[a-z0-9]{3}\..*-s-account\.workers\.dev/` OR `filename:("/api/device/start" AND "/api/device/status/")`                                             | CF Workers subdomain pattern OR EvilTokens API path    | high          | TODO           |
| Kali365 (ODx device code) | Sekoia/Proofpoint-published fingerprints                                                                                                                                                                                                                                                                | varies                                                 | medium        | TODO           |

Most rows above are grounded in Sekoia's June 2025 "Global analysis of
Adversary-in-the-Middle phishing threats" report
(`https://blog.sekoia.io/global-analysis-of-adversary-in-the-middle-phishing-threats/`,
local snapshot at `intel/snapshots/2025-06-sekoia-global-aitm/`).

## Kit fingerprint table

For each kit, populate: known signin paths | redirect chain shape | CDN/ASN
preferences | JS/CSS artifact hashes | post-auth API call patterns. Each
row must back a `_citations` entry in the observation file. Placeholders
allowed but flagged at promotion time.

## MITRE technique to atomic stub cookbook

Cookbook entries are **seeds**, not authoritative mappings. Every atomic
stub the model produces must independently cite per the discipline above.

| Behavior                                                | T-ID         | Wrap-tool candidate                  |
|---------------------------------------------------------|--------------|--------------------------------------|
| AiTM session-cookie capture                             | T1539        | Hand-replay only (lab fixture)       |
| Refresh-token theft / FOCI abuse                        | T1550.001    | TokenTacticsV2 / GraphRunner         |
| OAuth illicit consent grant                             | T1528        | GraphRunner / Microsoft.Graph        |
| Device-code phishing                                    | T1566.002 + T1078.004 | TokenTacticsV2 / roadtx     |
| Mailbox inbox-rule persistence                          | T1564.008    | ExchangeOnlineManagement             |
| Registered-device addition                              | T1098.005    | AADInternals / roadtx                |
| App-consent / SP-creation persistence                   | T1098.003    | Microsoft.Graph                      |
| MFA-method registration tamper                          | T1556.006    | Microsoft.Graph                      |
| PRT cookie generation (e.g. EvilTokens `/api/prt/cookie`) | T1539      | AADInternals / roadtx                |
| Refresh-token replay for arbitrary resource (e.g. EvilTokens `/api/prt/refresh`) | T1550.001 | TokenTacticsV2 |
| Graph reconnaissance (`/me`, `/organization`, `/users`, `/groups`, `/applications`, `/domains`, `/directoryRoles`) | T1087.004 | GraphRunner / Microsoft.Graph |
| Azure subscription enumeration                          | T1526        | GraphRunner / Az PowerShell          |

## Telemetry expectation patterns

Every entry MUST be either copied from a cited source OR set to
`<UNKNOWN -- verify against MS docs>`. NEVER invented.

Examples (sourced from MS Learn / Sekoia EvilTokens / current docs):

- Refresh-token redemption:
  `entra_signin { ResourceDisplayName: "Microsoft Graph", AuthenticationProtocol: "refreshToken", riskEventType: "unfamiliarFeatures" }`
- Inbox-rule create:
  `exo_audit { Operation: "New-InboxRule", RecordType: 2 }`
- Device registration:
  `entra_signin { appId: "01cb2876-7ebd-4aa4-9cc9-d28bd4d359a9", ResourceDisplayName: "Device Registration Service" }`
  + `graph_audit { Operation: "Add device" }`
- Illicit consent:
  `graph_audit { Operation: "Consent to application", Workload: "AzureActiveDirectory" }`
- Device-code authentication (legitimate-looking signin):
  `entra_signin { AuthenticationProtocol: "deviceCode" }` -- the *lack* of an
  AiTM signal is the signal; key Tacklebox telemetry expectation.

Default windows: `within_minutes: 5` for signin, `30` for UAL.

## Cross-kit detection patterns (synchronous-relay tells)

Grounded in Sekoia's June 2025 "Global analysis of Adversary-in-the-Middle
phishing threats" report. These apply across most synchronous-relay AiTM
kits (Tycoon 2FA, Storm-1167, Sneaky 2FA, Mamba 2FA, Saiga 2FA, Greatness,
Gabagool, CEPHAS) and should be considered as standard `expected_telemetry`
match candidates for any AiTM-cookie-capture atomic:

1. **User-Agent anomalies** -- relays hardcode the UA value rather than
   forwarding the victim's. Tells: missing UA, library-specific UA strings
   (e.g. `python-requests/`, `Go-http-client/`), invalid/fabricated UAs, or
   outdated/rare UAs. Field: `entra_signin.userAgent` /
   `ual.ExtendedProperties[Name=UserAgent].Value`.

2. **Application ID + Resource ID consistency** -- a given kit hits the
   same App ID consistently. Most PhaaS target `OfficeHome`
   (`4765445b-32c6-49b0-83e6-1d93765276ca`). Notable exceptions: EvilProxy
   targets `Office365` (`72782ba9-4490-4f03-8d82-562370ea3566`);
   NakedPages also targets Office 365 Exchange Online
   (`00000002-0000-0ff1-ce00-000000000000`). Field:
   `entra_signin.appId` / `ual.ApplicationId`.

3. **ASN / country of source IP** -- kits operate from hosting ASs, not
   ISP ASs. Centralised kits use single hosting ASs (e.g. Storm-1167 ->
   AS19871 US or AS132203 DE/US). Field:
   `entra_signin.autonomousSystemNumber` /
   `entra_signin.location.countryOrRegion`. Note: residential-proxy kits
   (Caffeine/ONNX historically; Greatness, Mamba 2FA currently) defeat
   this signal.

4. **Correlation ID reuse** -- some kits fail to generate a unique UUID
   per signin and reuse the same correlation ID across multiple
   authentication attempts. Field: `entra_signin.correlationId` /
   `ual.InterSystemsId`.

5. **Incoherences across authentication steps** -- a single auth attempt
   should produce events sharing a correlation ID. Synchronous-relay bugs
   cause UA, ASN, or country to *vary* within those events. Detection is
   correlation-grouped variance, not single-event content.

Source: Sekoia, "Global analysis of Adversary-in-the-Middle phishing
threats", June 2025
(`https://blog.sekoia.io/global-analysis-of-adversary-in-the-middle-phishing-threats/`,
local snapshot `intel/snapshots/2025-06-sekoia-global-aitm/`).

## Output file layout

Drafts (this skill writes here):

```
intel/kits/<kit-slug>/
  observation.md             # human-readable analyst observations + sources
  rig.draft.yaml             # draft rig; steps[*].atomic uses bare T-ID
  chokepoints.md             # per-chokepoint summary linking to detection-chokepoints URLs
  atomics/
    T1539.draft.yaml         # one file per T-ID this kit exercises
    T1550.001.draft.yaml
    T1087.004.draft.yaml
```

Production target (human writes here at promotion):

```
atomics/T####-<behavior-slug>/T####-<behavior-slug>.yaml
rigs/<kit-slug>.yaml         # steps[*].atomic uses the full slug ID
```

`<behavior-slug>` is descriptive of the behavior, not the kit. Existing
examples in the production tree: `T1078.004-device-code`,
`T1078.004-auth-broker-abuse`, `T1539-cookie-replay`,
`T1550.001-token-refresh-swap`, `T1087.004-graph-enumeration`. Per-kit
variants of the same behavior live in the same atomic file as additional
entries in `atomic_tests[]`.

Canonical worked example: `intel/kits/eviltokens/`. New kit write-ups should
mirror its structure.

## Drafting templates

The skill writes these verbatim with placeholders. Citations REQUIRED on
every atomic draft.

### `intel/kits/<kit-slug>/atomics/T####.draft.yaml`

```yaml
# LAB TENANT ONLY -- Tacklebox.psm1 enforces at load
attack_technique: T####
display_name: <human-readable behavior>
_mapping_confidence: medium  # low | medium | high
_mapping_confidence_rationale: "<one-line justification for the T-ID choice -- validator rejects empty values>"
_citations:
  - claim_type: kit_internals
    source_url: https://blog.sekoia.io/...
    quote_or_anchor: "verbatim or section anchor"
  - claim_type: entra_telemetry
    source_url: https://learn.microsoft.com/...
    quote_or_anchor: "appId / Operation reference"
atomic_tests:
  - name: <kit-name> variant
    auto_generated_guid: "00000000-0000-0000-0000-000000000000"  # regenerate at promotion
    description: <what this variant does>
    supported_platforms: [windows]
    auth_profile: lab-user-mfa
    executor:
      name: powershell
      command: |
        # LAB TENANT ONLY -- Tacklebox.psm1 enforces at load
        # wrap-tool: <one of dependencies/manifests/*.json>
        throw "stub -- implement against lab tenant"
    expected_telemetry:
      - source: entra_signin
        within_minutes: 5
        match:
          AuthenticationProtocol: "<UNKNOWN -- verify against MS docs>"
    exercises_chokepoint:
      id: CP-TODO
      url: https://iimp0ster.github.io/detection-chokepoints/CP-TODO
```

### `intel/kits/<kit-slug>/rig.draft.yaml`

```yaml
# LAB TENANT ONLY. Draft -- do not move to /rigs/ until promotion checklist is green.
# steps[*].atomic and requires_token_from use bare T-IDs in drafts;
# promotion resolves each to the full T####-<behavior-slug> form.
rig: <kit-slug>
display_name: "<Kit Display Name> emulation"
description: "Post-auth chain observed in <kit> campaigns as of YYYY-MM-DD."
ua_profile: edge-windows
egress_profile: residential
stop_on_error: true
_citations:
  - claim_type: aitm_tradecraft
    source_url: https://...
    quote_or_anchor: "..."
steps:
  - atomic: T####
    test_name: "<short verb-first description>"
    requires_token_from: T####
```

### `intel/kits/<kit-slug>/observation.md`

```markdown
# <kit-slug> observation -- <YYYY-MM-DD>

## Kit identification
<how the kit was fingerprinted; URLScan queries that hit>

## Post-auth behaviors observed
<enumerated list, each with grounding>

## Lab-safe primitive vs. observed TTP
<Required section. If any actual kit behavior cannot be lab-safely
emulated (e.g. AiTM requires standing up a reverse-proxy relay; the
framework deliberately does not), document the substitution here and
note which draft atomic's executor uses the substitute. Example: "Tycoon
captures session cookies via reverse-proxy AiTM relay. Tacklebox does
not stand up a relay; T1539 draft emulates capture by performing an
interactive signin from a Tacklebox client and persisting the cookie.
Telemetry shape is similar but the relayed-signin UA pattern is
absent.">

## Sources consulted
- Tier 1: <list with URLs>
- Tier 2: <list with URLs>

## Open questions
<gaps to fill before promotion>
```

### `intel/kits/<kit-slug>/chokepoints.md`

```markdown
# <kit-slug> -> chokepoint mapping

| Step | T-ID | Chokepoint | URL | Confidence (L/M/H) |
|------|------|------------|-----|--------------------|
| 1    | T#### | CP-####    | https://iimp0ster.github.io/detection-chokepoints/CP-#### | M |
```

## False-positive / pre-promotion checklist

- [ ] Kit attribution backed by >=2 independent OSINT sources OR 1 tier_1
      research source.
- [ ] Every atomic wraps a tool in `dependencies/manifests/`. Hand-rolled HTTP
      is rejected.
- [ ] Every `expected_telemetry` row references a real `Operation` /
      `RecordType` / `appId`. No `<UNKNOWN>` allowed at promotion.
- [ ] No real tenant strings in any artifact.
- [ ] UUIDs freshly generated at promotion.
- [ ] Chokepoint URLs resolve.
- [ ] Rig `steps[*].atomic` IDs resolve to a real file or sibling draft.
- [ ] `tools/check_grounding.py` passes against every `T####.draft.yaml`.
- [ ] `_mapping_confidence` is `medium` or `high` (or has a tier_1 citation
      for `low`).

## Promotion workflow (human-only)

Drafts in `intel/kits/<kit-slug>/` are not runnable. Promotion to
`atomics/` and `rigs/` is gated by the pre-commit hook
(`tools/pre-commit-block-direct-writes.sh`) and the production schema.

1. Pick a draft from `intel/kits/<kit-slug>/atomics/T####.draft.yaml`.
2. Confirm `tools/check_grounding.py` passes.
3. Generate a real UUID: `pwsh -c '[guid]::NewGuid().Guid'`. Replace the
   placeholder.
4. Decide the promotion target:
   - **Consolidate (preferred)** if an existing
     `atomics/T####-<slug>/T####-<slug>.yaml` matches the behavior: append
     a new entry to its `atomic_tests[]` array. Do NOT create a duplicate
     atomic file.
   - **Create new** if no existing slug matches: create
     `atomics/T####-<behavior-slug>/T####-<behavior-slug>.yaml` where
     `<behavior-slug>` describes the *behavior*, not the kit (existing
     examples: `T1078.004-device-code`, `T1539-cookie-replay`).
5. Implement `executor.command` against a wrap-tool listed in
   `dependencies/manifests/`. Hand-rolled HTTP is rejected.
6. Strip all underscored draft fields (`_citations`, `_mapping_confidence`).
   The production schema's `additionalProperties: false` will reject them,
   which is the desired forcing function.
7. Resolve every `<UNKNOWN>` telemetry placeholder to a real value.
8. Validate:
   `ajv validate -s schema/tacklebox-atomic.schema.json -d atomics/T####/T####.yaml`
9. Move the rig to `rigs/<kit-slug>.yaml`. The `rig:` field must equal the
   filename stem (regex `^[a-z0-9][a-z0-9-]*$`). Resolve every
   `steps[*].atomic` from the bare T-ID in the draft to the full
   `T####-<behavior-slug>` form picked in step 4. Update
   `requires_token_from` references the same way.
10. Validate the rig:
    `ajv validate -s schema/tacklebox-rig.schema.json -d rigs/<kit-slug>.yaml`
11. Confirm `Tacklebox.psm1` lab-tenant guard loads cleanly. Commit message
    includes the literal `[PROMOTE]` token (required by the pre-commit
    hook). PR description states the lab tenant ID used for replay.

## Worked example

`intel/kits/eviltokens/` is the canonical reference. New kit write-ups should
match its shape and citation density. If you find yourself reaching for
placeholders or `<UNKNOWN>`, stop and re-read the tier-1 source.
