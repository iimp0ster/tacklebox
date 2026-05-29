from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, Iterable, List


try:
    import jsonschema  # type: ignore[import]
except Exception:  # pragma: no cover - optional dependency
    jsonschema = None  # type: ignore[assignment]


REPO_ROOT = Path(__file__).resolve().parent
SCHEMA_PATH = REPO_ROOT / "intel_pipeline" / "schema" / "intel_schema.json"


def _load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _schema_validate(data: Any, schema: Dict[str, Any]) -> List[str]:
    errors: List[str] = []

    if jsonschema is None:
        # Minimal structural checks when jsonschema is not installed.
        if not isinstance(data, dict):
            errors.append("Top-level object must be a JSON object.")
            return errors

        for field in ("version", "generated_at", "threat", "sources", "observables"):
            if field not in data:
                errors.append(f"Missing required top-level field: {field}")
        return errors

    validator = jsonschema.Draft7Validator(schema)  # type: ignore[attr-defined]
    for err in validator.iter_errors(data):
        location = " -> ".join(str(x) for x in err.absolute_path)
        if location:
            msg = f"{location}: {err.message}"
        else:
            msg = err.message
        errors.append(msg)

    return errors


def _semantic_validate(data: Dict[str, Any]) -> List[str]:
    errors: List[str] = []

    if not isinstance(data.get("sources"), list) or not data["sources"]:
        errors.append("sources must be a non-empty array.")
    else:
        source_names = {str(s.get("name", "")).lower() for s in data["sources"] if isinstance(s, dict)}
        if "urlscan" not in source_names:
            errors.append("sources must include an entry with name 'urlscan'.")

    observables = data.get("observables") or []
    if not isinstance(observables, list):
        errors.append("observables must be an array.")
        observables = []

    # Map observable_id -> observable
    observable_ids = set()
    for obs in observables:
        if not isinstance(obs, dict):
            errors.append("Each observable must be an object.")
            continue
        obs_id = obs.get("id")
        if not isinstance(obs_id, str) or not obs_id:
            errors.append("Each observable must have a non-empty string id.")
        else:
            observable_ids.add(obs_id)

        evidence = obs.get("evidence") or []
        if not isinstance(evidence, list) or not evidence:
            errors.append(f"Observable {obs_id!r} must have at least one evidence item.")
        else:
            for ev in evidence:
                if not isinstance(ev, dict):
                    errors.append(f"Observable {obs_id!r} evidence items must be objects.")
                    continue
                if "source" not in ev:
                    errors.append(f"Observable {obs_id!r} evidence items must include 'source'.")

    findings = data.get("findings") or []
    if isinstance(findings, list):
        for finding in findings:
            if not isinstance(finding, dict):
                errors.append("Each finding must be an object.")
                continue
            ev_list = finding.get("evidence") or []
            if not isinstance(ev_list, list) or not ev_list:
                errors.append(f"Finding {finding.get('id', '<unknown>')!r} must have at least one evidence entry.")
                continue
            for ev in ev_list:
                if not isinstance(ev, dict):
                    errors.append("Finding evidence entries must be objects.")
                    continue
                obs_ref = ev.get("observable_id")
                if not isinstance(obs_ref, str) or not obs_ref:
                    errors.append("Finding evidence entries must include non-empty observable_id.")
                elif obs_ref not in observable_ids:
                    errors.append(
                        f"Finding references unknown observable_id {obs_ref!r}."
                    )

    no_data_found = data.get("no_data_found")
    if isinstance(no_data_found, bool):
        if no_data_found and observables:
            errors.append("no_data_found is true but observables array is non-empty.")
        if not no_data_found and not observables:
            errors.append("no_data_found is false but observables array is empty.")

    return errors


def validate_intel_object(data: Dict[str, Any]) -> List[str]:
    """
    Validate an intel object against the JSON schema and semantic rules.

    Returns a list of human-readable error messages. An empty list means
    validation succeeded.
    """

    if not SCHEMA_PATH.is_file():
        return [f"Schema file not found at {SCHEMA_PATH}."]

    schema = _load_json(SCHEMA_PATH)

    errors: List[str] = []
    errors.extend(_schema_validate(data, schema))

    if not errors and isinstance(data, dict):
        errors.extend(_semantic_validate(data))

    return errors


def _parse_args(argv: Iterable[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate an OSINT intel JSON object against the intel schema.",
    )
    parser.add_argument(
        "path",
        help="Path to the intel JSON file to validate.",
    )
    return parser.parse_args(list(argv) if argv is not None else None)


def main(argv: Iterable[str] | None = None) -> int:
    args = _parse_args(argv)
    path = Path(args.path)

    if not path.is_file():
        print(f"ERROR: file not found: {path}")
        return 1

    try:
        data = _load_json(path)
    except Exception as exc:
        print(f"ERROR: failed to load JSON from {path}: {exc}")
        return 1

    errors = validate_intel_object(data)  # type: ignore[arg-type]
    if errors:
        print("Validation failed:")
        for err in errors:
            print(f"  - {err}")
        return 1

    print("Validation succeeded.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

