import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import generated from '../app/content/generated.json' with { type: 'json' };
import mappings from '../app/content/atomic-mappings.json' with { type: 'json' };
import contracts from '../app/content/atomic-validation.json' with { type: 'json' };

const atomicsBySlug = new Map(generated.atomics.map((atomic) => [atomic.slug, atomic]));

test('explicit handoffs match atomic technique, auth profile, and validation contracts', () => {
  for (const mapping of [...mappings.convergence, ...mappings.relations]) {
    const atomic = atomicsBySlug.get(mapping.slug);
    assert.ok(atomic, `${mapping.slug} must exist`);
    assert.equal(atomic.technique, mapping.technique, `${mapping.slug} technique`);
    assert.equal(
      atomic.authProfile,
      mapping.authProfile,
      `${mapping.slug} auth profile`,
    );
    assert.ok(mapping.safeSubstitute.length > 20, `${mapping.slug} delta`);
    assert.ok(mapping.provenance.length > 12, `${mapping.slug} provenance`);

    const contract = contracts[mapping.slug];
    assert.ok(contract, `${mapping.slug} requires an atomic validation contract`);
    assert.ok(contract.validation.query.length > 20, `${mapping.slug} query`);
    assert.ok(contract.validation.pass.length > 20, `${mapping.slug} pass criterion`);
    assert.ok(contract.validation.fail.length > 20, `${mapping.slug} fail criterion`);
    assert.ok(contract.cleanup.local.length > 20, `${mapping.slug} local cleanup`);
    assert.ok(contract.cleanup.tenant.length > 20, `${mapping.slug} tenant cleanup`);
  }
});

test('device authorization is not mapped to the consent-grant atomic', () => {
  assert.equal(
    mappings.convergence.some((mapping) => mapping.slug === 'T1528-oauth-consent-grant'),
    false,
  );
  assert.equal(contracts['T1528-oauth-consent-grant'].status, 'planned');
  assert.match(
    contracts['T1528-oauth-consent-grant'].provenance,
    /not a device-authorization emulation/i,
  );
});

test('mapping scopes name existing convergence procedures and exact Tycoon relations', async () => {
  const [convergence, infrastructure] = await Promise.all([
    readFile(new URL('../app/content/kit-convergence.ts', import.meta.url), 'utf8'),
    readFile(new URL('../app/content/infrastructure.ts', import.meta.url), 'utf8'),
  ]);

  for (const mapping of mappings.convergence) {
    assert.match(convergence, new RegExp(`id: '${mapping.recordId}'`));
    assert.match(convergence, new RegExp(`'${mapping.kitId}'`));
  }
  for (const mapping of mappings.relations) {
    assert.equal(mapping.kitId, 'tycoon');
    assert.match(infrastructure, new RegExp(`id: '${mapping.relationId}'`));
  }
});
