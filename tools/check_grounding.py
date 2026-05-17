#!/usr/bin/env python3
"""
check_grounding.py -- enforce source/claim alignment on draft atomics.

Each draft atomic file (intel/kits/<kit-slug>/atomics/T####.draft.yaml) may
carry an underscored `_citations` block. Every entry has:

  - claim_type:    one of the recognized claim types in trusted_sources.yaml
  - source_url:    URL of the source backing the claim
  - quote_or_anchor: short verbatim snippet or section anchor (for human audit)

This validator confirms:

  1. Every cited source_url resolves to a domain in trusted_sources.yaml
     (or canonical_docs).
  2. The cited source's `grounds` list includes the cited `claim_type`.
  3. Sufficiency rule:
       - tier_1 with matching grounds       -> OK alone
       - tier_2 with matching grounds       -> needs a second independent
                                               citation (T1 or T2, different
                                               domain) for the SAME claim_type
       - tier_3 / canonical_docs alone      -> insufficient as primary
         (canonical_docs OK alone for entra_telemetry / kql_queries / mitigations)
  4. `_mapping_confidence` (if present on a MITRE T-ID claim) must be one of
     low | medium | high. `low` requires the citation gate to be satisfied
     by at least one tier_1 citation -- low-confidence T-ID mappings cannot
     ride on tier_2 alone.

Exits 1 on any failure so this can be wired into pre-commit or the existing
ajv validation step.

Usage:
    python check_grounding.py intel/kits/eviltokens/atomics/T1539.draft.yaml
    python check_grounding.py --sources trusted_sources.yaml <file>...

Dependencies:
    pip install pyyaml
"""

import argparse
import sys
from pathlib import Path
from urllib.parse import urlparse

try:
    import yaml
except ImportError:
    sys.exit("Missing dependency. Run: pip install pyyaml")


# Claim types that can ride on canonical_docs (Microsoft Learn) alone.
CANONICAL_OK_ALONE = {"entra_telemetry", "kql_queries", "mitigations"}


def load_yaml(path):
    try:
        return yaml.safe_load(Path(path).read_text(encoding="utf-8"))
    except FileNotFoundError:
        sys.exit(f"File not found: {path}")
    except yaml.YAMLError as e:
        sys.exit(f"Invalid YAML in {path}: {e}")


def normalize_domain(url):
    """Return host with leading 'www.' stripped, plus an optional first path
    segment, so 'proofpoint.com/us/blog/threat-insight/xyz' matches the
    registry entry 'proofpoint.com/us/blog/threat-insight'."""
    try:
        parsed = urlparse(url)
        host = (parsed.netloc or "").lower()
        if host.startswith("www."):
            host = host[4:]
        path = parsed.path.rstrip("/")
        # Return both candidates -- the matcher will try the longer one first.
        return host, host + path
    except Exception:
        return "", ""


def build_source_index(sources_doc):
    """Flatten the tiered registry into a list of (entry, tier_label) tuples
    sorted by descending domain-key length, so longer prefixes match first."""
    entries = []
    for tier_label in ("tier_1", "tier_2", "tier_3", "canonical_docs"):
        for entry in sources_doc.get(tier_label, []) or []:
            entries.append((entry, tier_label))
    # Match longer domain keys first (e.g. proofpoint.com/us/blog/threat-insight
    # should beat proofpoint.com).
    entries.sort(key=lambda x: len(x[0].get("domain", "")), reverse=True)
    return entries


def match_source(url, source_index):
    """Return (entry, tier_label) or (None, None) if no source matches."""
    host, host_path = normalize_domain(url)
    if not host:
        return None, None
    for entry, tier_label in source_index:
        domain_key = entry["domain"].lower().rstrip("/")
        if host_path == domain_key or host_path.startswith(domain_key + "/"):
            return entry, tier_label
        if host == domain_key:
            return entry, tier_label
    return None, None


def check_atomic(path, source_index):
    """Return a list of human-readable problems for this draft atomic."""
    data = load_yaml(path)
    if not isinstance(data, dict):
        return [f"  structure: top-level YAML must be a mapping"]

    citations = data.get("_citations")
    if not citations:
        return [f"  citations: no _citations block -- draft must cite every "
                f"kit-internal, telemetry, or T-ID claim"]
    if not isinstance(citations, list):
        return [f"  citations: _citations must be a list"]

    problems = []

    # Group citations by claim_type so we can apply the sufficiency rule
    # per claim_type, not per individual citation.
    by_claim = {}
    for i, cit in enumerate(citations):
        if not isinstance(cit, dict):
            problems.append(f"  citations[{i}]: must be a mapping")
            continue

        claim_type = cit.get("claim_type")
        source_url = cit.get("source_url")
        if not claim_type or not isinstance(claim_type, str):
            problems.append(f"  citations[{i}]: missing claim_type")
            continue
        if not source_url or not isinstance(source_url, str):
            problems.append(f"  citations[{i}]: missing source_url for "
                            f"claim_type={claim_type}")
            continue

        entry, tier = match_source(source_url, source_index)
        if entry is None:
            problems.append(f"  citations[{i}]: source_url not on approved "
                            f"list -> {source_url}")
            continue

        grounds = entry.get("grounds", []) or []
        if claim_type not in grounds:
            problems.append(
                f"  citations[{i}]: {entry['name']} ({tier}) does not ground "
                f"claim_type={claim_type}. Allowed grounds: {sorted(grounds)}"
            )
            continue

        by_claim.setdefault(claim_type, []).append((entry, tier, source_url))

    # Sufficiency check per claim_type.
    for claim_type, hits in by_claim.items():
        tiers = [t for _, t, _ in hits]
        domains_seen = {e["domain"] for e, _, _ in hits}

        has_t1 = "tier_1" in tiers
        t2_distinct = sum(1 for _, t, _ in hits if t == "tier_2")
        # Distinct tier_2 domains:
        t2_domains = {e["domain"] for e, t, _ in hits if t == "tier_2"}
        canonical_only = all(t == "canonical_docs" for t in tiers)
        tier3_only = all(t == "tier_3" for t in tiers)

        # Sole-authority short-circuit: a single tier_2 source flagged as
        # sole_authority_for this claim_type is sufficient on its own.
        sole_auth_hit = any(
            t == "tier_2" and claim_type in (e.get("sole_authority_for") or [])
            for e, t, _ in hits
        )
        if sole_auth_hit:
            continue

        if has_t1:
            continue  # tier_1 with matching grounds is sufficient alone
        if canonical_only and claim_type in CANONICAL_OK_ALONE:
            continue  # canonical docs OK alone for these claim types
        if len(t2_domains) >= 2:
            continue  # two independent tier_2 sources is sufficient
        if tier3_only:
            problems.append(
                f"  sufficiency: claim_type={claim_type} is grounded only "
                f"by tier_3 sources -- insufficient"
            )
            continue
        if t2_distinct == 1 and not has_t1:
            problems.append(
                f"  sufficiency: claim_type={claim_type} grounded by a single "
                f"tier_2 source -- needs a tier_1 citation OR a second "
                f"independent tier_2 source"
            )
            continue
        if canonical_only and claim_type not in CANONICAL_OK_ALONE:
            problems.append(
                f"  sufficiency: claim_type={claim_type} grounded only by "
                f"canonical_docs -- this claim type requires a research "
                f"source as primary"
            )

    # _mapping_confidence rule: low requires at least one tier_1 citation.
    confidence = data.get("_mapping_confidence")
    if confidence == "low":
        any_t1 = any(t == "tier_1" for hits in by_claim.values() for _, t, _ in hits)
        if not any_t1:
            problems.append(
                f"  mapping_confidence: _mapping_confidence=low requires at "
                f"least one tier_1 citation"
            )
    elif confidence is not None and confidence not in ("low", "medium", "high"):
        problems.append(
            f"  mapping_confidence: must be one of low|medium|high, got "
            f"{confidence!r}"
        )

    return problems


def main():
    parser = argparse.ArgumentParser(
        description="Validate draft atomic citations against trusted sources."
    )
    parser.add_argument("files", nargs="+", help="Draft atomic YAML files")
    parser.add_argument(
        "--sources",
        default="trusted_sources.yaml",
        help="Path to trusted_sources.yaml (default: trusted_sources.yaml)",
    )
    args = parser.parse_args()

    sources_doc = load_yaml(args.sources)
    source_index = build_source_index(sources_doc)

    any_failure = False
    for path in args.files:
        problems = check_atomic(path, source_index)
        if problems:
            any_failure = True
            print(f"REJECTED: {path}")
            print("\n".join(problems))
            print()
        else:
            print(f"PASSED:   {path}")

    sys.exit(1 if any_failure else 0)


if __name__ == "__main__":
    main()
