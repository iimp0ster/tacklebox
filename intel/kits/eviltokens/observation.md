# eviltokens observation -- 2026-05-17

> Canonical worked example for the `aitm-kit-ttp-collector` skill. New kit
> write-ups should mirror this shape and citation density.

## Kit identification

EvilTokens is a device-code phishing-as-a-service kit profiled by Sekoia TDR
in May 2025. Distinguishing characteristics:

- Lure pages hosted on Cloudflare Workers subdomains matching
  `(adobe|page-adobe|calendar_invite|docusign|page-docusign|quarantine|fax|onedrive|page-password|sharepoint|voicemail|index)-[a-z0-9]{3}\..*-s-account\.workers\.dev`
- Backend exposes a discrete REST API: `/api/device/start`,
  `/api/device/status/`, `/api/prt/cookie`, `/api/prt/refresh`,
  `/api/prt/recon`
- Token weaponization is the kit's selling point: after the victim completes
  the device-code prompt on `microsoft.com/devicelogin`, the kit collects
  the resulting refresh token, mints PRT cookies, and exposes Graph
  reconnaissance through `/api/prt/recon`

URLScan queries that hit (see `SKILL.md` for the full table):

```
page.domain:/(adobe|page-adobe|calendar_invite|docusign|page-docusign|quarantine|fax|onedrive|page-password|sharepoint|voicemail|index)-[a-z0-9]{3}\..*-s-account\.workers\.dev/
filename:("/api/device/start" AND "/api/device/status/")
```

## Post-auth behaviors observed

| Behavior                                         | T-ID       | Draft atomic                              |
|--------------------------------------------------|------------|-------------------------------------------|
| Device-code redemption against Microsoft `/common/oauth2/token` | T1078.004  | `atomics/T1078.004.draft.yaml`            |
| Refresh-token replay via `/api/prt/refresh`      | T1550.001  | `atomics/T1550.001.draft.yaml`            |
| PRT cookie generation via `/api/prt/cookie`      | T1539      | `atomics/T1539.draft.yaml`                |
| Graph reconnaissance via `/api/prt/recon`        | T1087.004  | `atomics/T1087.004.draft.yaml`            |

All four mappings carry `_mapping_confidence: medium`. None of the cited
sources state the MITRE T-ID explicitly, so promotion to `high` requires a
human MITRE-mapping review.

## Lab-safe primitive vs. observed TTP

EvilTokens is one of the rare kits where the actual TTP and the lab-safe
emulation align cleanly. The kit calls Microsoft's real device-code
endpoints; Tacklebox can do the same against a lab tenant without
standing up any kit infrastructure. The four draft atomic executors map
1:1 to wrap-tools (`TokenTacticsV2`, `AADInternals`, `roadtx`,
`GraphRunner`) that drive Microsoft's own endpoints.

No primitive substitution is in effect. The only divergence from a real
EvilTokens compromise is the absence of the kit's operator-side
dashboard (`/api/prt/cookie`, `/api/prt/refresh`, `/api/prt/recon`) --
Tacklebox skips the relay and calls the Microsoft endpoints directly,
which produces the same Entra telemetry on the victim tenant.

## Sources consulted

Tier 1:
- Sekoia TDR -- "New widespread EvilTokens kit: Device Code Phishing as a
  Service (Part 1)" -- `https://blog.sekoia.io/new-widespread-eviltokens-kit-device-code-phishing-as-a-service-part-1/`
  (URL is the citation anchor; quote text in each atomic is pulled from the
  endpoint names verbatim and is auditable on read.)

Canonical:
- Microsoft Learn -- Entra sign-in log schema, `AuthenticationProtocol`
  values, well-known appIds. `https://learn.microsoft.com/en-us/entra/identity/monitoring-health/concept-sign-in-log-activity-details`

Tier 2 (context only, not grounding any specific claim above):
- Proofpoint Threat Insight -- FlowerStorm/ODx ecosystem overlap.
- Sublime Security -- email-layer obfuscation of the device-code lure.

## Promotion workflow notes

- The four draft atomics intentionally do not conform to
  `schema/tacklebox-atomic.schema.json` (they carry `_citations` and
  `_mapping_confidence`, both forbidden by `additionalProperties: false`).
  That is the forcing function: promotion requires stripping draft metadata.
- The draft executors `throw "stub"` rather than make HTTP calls. The
  promotion implementer wraps a tool from `dependencies/manifests/` --
  `TokenTacticsV2`, `AADInternals`, or `roadtx` for the token primitives;
  `GraphRunner` or `Microsoft.Graph` for the recon atomic.
- `chokepoint` lives on the atomic (`exercises_chokepoint`) per the schema,
  not on the rig step. `chokepoints.md` is the cross-kit summary.

## Promotion targets in the current production tree

The skill's promotion step 4 calls for consolidating into an existing
`atomics/T####-<behavior-slug>/` when one matches, else creating a new
directory. Mapping for EvilTokens:

| Draft                              | Existing atomic that matches                | Decision         |
|------------------------------------|---------------------------------------------|------------------|
| `T1078.004.draft.yaml`             | `atomics/T1078.004-device-code/`            | **Consolidate** -- append an EvilTokens-flavored entry to `atomic_tests[]` |
| `T1550.001.draft.yaml`             | `atomics/T1550.001-token-refresh-swap/`     | **Consolidate** -- append an EvilTokens-flavored entry to `atomic_tests[]` |
| `T1539.draft.yaml` (PRT minting)   | `atomics/T1539-cookie-replay/` (different behavior -- cookie *replay*, not *mint*) | **Create new**: propose `atomics/T1539-prt-cookie-mint/` |
| `T1087.004.draft.yaml`             | `atomics/T1087.004-graph-enumeration/`      | **Consolidate** OR **Create new** `atomics/T1087.004-graph-recon-bulk/` if the kit's batch-snapshot pattern is materially distinct from the existing per-endpoint enumeration. Human judgment call. |

At promotion the rig's `steps[*].atomic` and `requires_token_from` values
get rewritten from bare T-IDs to the full slug-form IDs picked above.

## Open questions

- [ ] Confirm Sekoia Part 2 (if published) -- the validator does not detect
      missing siblings; manual check required.
- [ ] Verify `AuthenticationProtocol: "deviceCode"` is the literal string
      Microsoft emits (vs. `"deviceCodeFlow"` or `"OAuth 2.0 Device Code"`).
      Currently marked `<UNKNOWN -- verify against MS docs>` in atomic.
- [ ] Confirm the well-known Office client_id used by the kit's
      `/api/device/start` call. Sekoia post should name it; if it does,
      pull verbatim into `T1078.004.draft.yaml`.
- [ ] Map each behavior to a chokepoint ID once
      `iimp0ster.github.io/detection-chokepoints/` publishes the
      device-code-phishing chokepoint family. Placeholders below.
