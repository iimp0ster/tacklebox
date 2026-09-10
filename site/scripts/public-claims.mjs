import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const CLAIM_KEYS = ['schema_version', 'claim_id', 'producer', 'upstream_evidence_ref', 'kit_id', 'behavior_id', 'role', 'direction', 'chokepoint_ref', 'detection_tier', 'evidence_class', 'confidence', 'time_basis', 'observed_date', 'source_published_date', 'review_state', 'caveat', 'provenance', 'judgment'];
const REF_KEYS = ['schema_version', 'provider', 'ref_id'];
const PROVENANCE_KEYS = ['source_url', 'source_sha256'];
const JUDGMENT_KEYS = ['schema_version', 'subject_revision_sha256', 'verdict'];
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const CLAIM_ID = /^tpc_[a-f0-9]{32}$/;
const CHOKEPOINT = /^detection-chokepoints\/[a-z0-9][a-z0-9-]{1,120}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ROLES = new Set(['delivery', 'gate', 'relay', 'identity_provider', 'operator', 'cloud_action', 'sensor', 'unknown']);
const DIRECTIONS = new Set(['victim_to_kit', 'kit_to_identity', 'identity_to_kit', 'operator_to_cloud', 'sensor_observation', 'not_applicable', 'unknown']);
const TIERS = new Set(['Research', 'Hunt', 'Analyst']);
const EVIDENCE = new Set(['source_backed', 'synthetic_fixture', 'locally_observed', 'inference', 'coverage_limitation']);
const CONFIDENCE = new Set(['low', 'medium', 'high', 'unknown']);
const TIME_BASES = new Set(['observed', 'source_published']);
const FORBIDDEN = [
  /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
  /(?:\b(?:[a-f0-9]{1,4}:){4,}[a-f0-9:]{0,}\b|(?<![a-f0-9])(?:[a-f0-9]{0,4}:){1,7}:[a-f0-9:]{0,}(?![a-f0-9]))/i,
  /\b(?:bearer|basic)\s+[a-z0-9._~+/-]{8,}/i,
  /(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret)\s*[=:]/i,
  /(?:set-cookie|cookie)\s*:/i,
  /<(?:script|iframe|object|embed)\b/i,
];

function exactKeys(value, keys) {
  return value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function forbiddenValue(value) {
  if (typeof value === 'string') return FORBIDDEN.some((pattern) => pattern.test(value));
  if (Array.isArray(value)) return value.some(forbiddenValue);
  if (!value || typeof value !== 'object') return false;
  return Object.values(value).some(forbiddenValue);
}

function publicUrl(value) {
  if (value === null) return true;
  try {
    const parsed = new URL(String(value));
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password && !parsed.search && !parsed.hash
      && parsed.hostname.includes('.') && parsed.hostname !== 'localhost' && !parsed.hostname.endsWith('.local')
      && !parsed.hostname.includes(':');
  } catch { return false; }
}

function claimIdFor(claim) {
  const identity = {
    schema_version: claim.schema_version,
    producer: claim.producer,
    upstream_evidence_ref: {
      schema_version: claim.upstream_evidence_ref.schema_version,
      provider: claim.upstream_evidence_ref.provider,
      ref_id: claim.upstream_evidence_ref.ref_id,
    },
    kit_id: claim.kit_id,
    behavior_id: claim.behavior_id,
    role: claim.role,
    direction: claim.direction,
    chokepoint_ref: claim.chokepoint_ref,
    detection_tier: claim.detection_tier,
    evidence_class: claim.evidence_class,
    confidence: claim.confidence,
    time_basis: claim.time_basis,
    observed_date: claim.observed_date,
    source_published_date: claim.source_published_date,
    review_state: claim.review_state,
    caveat: claim.caveat,
    provenance: { source_url: claim.provenance.source_url, source_sha256: claim.provenance.source_sha256 },
    judgment: {
      schema_version: claim.judgment.schema_version,
      subject_revision_sha256: claim.judgment.subject_revision_sha256,
      verdict: claim.judgment.verdict,
    },
  };
  return `tpc_${createHash('sha256').update(JSON.stringify(identity), 'utf8').digest('hex').slice(0, 32)}`;
}

export function validatePublicClaim(claim) {
  const issues = [];
  if (!exactKeys(claim, CLAIM_KEYS)) return { valid: false, issues: ['invalid_claim_shape'] };
  if (claim.schema_version !== 'TackleboxPublicClaim/v1') issues.push('unsupported_schema');
  if (!CLAIM_ID.test(claim.claim_id || '') || claim.claim_id !== claimIdFor(claim)) issues.push('invalid_claim_id');
  if (claim.producer !== 'tacklebox') issues.push('invalid_producer');
  if (!exactKeys(claim.upstream_evidence_ref, REF_KEYS)
    || claim.upstream_evidence_ref.schema_version !== 'TackleboxEvidenceReference/v1'
    || claim.upstream_evidence_ref.provider !== 'intelopes'
    || !SAFE_ID.test(claim.upstream_evidence_ref.ref_id || '')) issues.push('invalid_upstream_reference');
  if (!SAFE_ID.test(claim.kit_id || '') || !SAFE_ID.test(claim.behavior_id || '')) issues.push('invalid_subject');
  if (!ROLES.has(claim.role) || !DIRECTIONS.has(claim.direction)) issues.push('invalid_relationship');
  if (!CHOKEPOINT.test(claim.chokepoint_ref || '') || !TIERS.has(claim.detection_tier)) issues.push('invalid_detection_context');
  if (!EVIDENCE.has(claim.evidence_class) || !CONFIDENCE.has(claim.confidence)) issues.push('invalid_evidence_context');
  if (!TIME_BASES.has(claim.time_basis)) issues.push('invalid_time_basis');
  const observedValid = claim.observed_date === null || (DATE.test(claim.observed_date) && !Number.isNaN(Date.parse(`${claim.observed_date}T00:00:00.000Z`)));
  const publishedValid = claim.source_published_date === null || (DATE.test(claim.source_published_date) && !Number.isNaN(Date.parse(`${claim.source_published_date}T00:00:00.000Z`)));
  if (!observedValid || !publishedValid
    || (claim.time_basis === 'observed' && claim.observed_date === null)
    || (claim.time_basis === 'source_published' && (claim.observed_date !== null || claim.source_published_date === null))) {
    issues.push('invalid_evidence_date');
  }
  if (claim.review_state !== 'approved' || typeof claim.caveat !== 'string' || !claim.caveat || claim.caveat.length > 1_000) issues.push('invalid_review_state');
  if (!exactKeys(claim.provenance, PROVENANCE_KEYS) || !publicUrl(claim.provenance.source_url)
    || !SHA256.test(claim.provenance.source_sha256 || '')) issues.push('invalid_provenance');
  if (!exactKeys(claim.judgment, JUDGMENT_KEYS) || claim.judgment.schema_version !== 'JudgmentRef/v1'
    || !SHA256.test(claim.judgment.subject_revision_sha256 || '') || claim.judgment.verdict !== 'pass') issues.push('invalid_judgment');
  if (forbiddenValue(claim)) issues.push('forbidden_value');
  return { valid: issues.length === 0, issues: [...new Set(issues)].sort() };
}

export function loadPublicClaims(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root).filter((name) => name.endsWith('.json')).sort().map((name) => {
    const claim = JSON.parse(readFileSync(join(root, name), 'utf8'));
    const checked = validatePublicClaim(claim);
    if (!checked.valid) throw new Error(`Unsafe public claim ${name}: ${checked.issues.join(', ')}`);
    return claim;
  });
}

export const _test = { claimIdFor, forbiddenValue };
