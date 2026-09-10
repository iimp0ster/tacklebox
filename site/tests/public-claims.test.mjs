import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validatePublicClaim } from '../scripts/public-claims.mjs';

const fixturePath = resolve('content/evidence/synthetic-intelopes-relay.json');
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));

test('accepts the deterministic Tacklebox projection produced from Intelopes', () => {
  assert.deepEqual(validatePublicClaim(fixture), { valid: true, issues: [] });
});

test('fails closed on identifier drift, field smuggling, and indicator-shaped values', () => {
  assert.ok(validatePublicClaim({ ...fixture, claim_id: 'tpc_' + 'a'.repeat(32) }).issues.includes('invalid_claim_id'));
  assert.deepEqual(validatePublicClaim({ ...fixture, raw: { body: 'smuggled' } }), { valid: false, issues: ['invalid_claim_shape'] });
  assert.ok(validatePublicClaim({ ...fixture, caveat: 'Observed at 203.0.113.10.' }).issues.includes('forbidden_value'));
});

test('refuses to label a source publication date as an observation date', () => {
  const mislabeled = {
    ...fixture,
    time_basis: 'source_published',
    source_published_date: fixture.observed_date,
  };
  assert.ok(validatePublicClaim(mislabeled).issues.includes('invalid_evidence_date'));
});
