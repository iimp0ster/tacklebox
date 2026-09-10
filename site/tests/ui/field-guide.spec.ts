import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

function failOnBrowserErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

test('primary field-guide views remain navigable and usable', async ({
  page,
}) => {
  const errors = failOnBrowserErrors(page);
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: /Understand the kit/i }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Emulate', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Emulate a behavior' }),
  ).toBeVisible();

  const search = page.getByPlaceholder('Search technique, behavior, or kit…');
  await search.fill('cookie replay');
  await expect(page.locator('.atomic-card')).toHaveCount(2);
  await search.fill('');

  await page
    .getByRole('link', { name: /Resource Owner Password Credentials flow/i })
    .click();
  await expect(
    page.getByRole('heading', {
      name: /Resource Owner Password Credentials flow/i,
    }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cleanup' })).toBeVisible();

  await page.goto('/');
  await page
    .getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('button', { name: 'Compare kits', exact: true })
    .click();
  await expect(
    page.getByRole('region', { name: 'AiTM kit convergence explorer' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Field guides', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Field guides' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Published analyses' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Open field guide' }),
  ).toHaveCount(2);
  await expect(
    page.getByRole('link', { name: 'Open field guide' }).nth(0),
  ).toHaveAttribute('href', '/infrastructure/sneaky-2fa');
  await expect(
    page.getByRole('link', { name: 'Open field guide' }).nth(1),
  ).toHaveAttribute('href', '/infrastructure/tycoon-2fa');
  await expect(page.getByText('Evidence gathering')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Reviewed evidence ledger' }),
  ).toBeVisible();
  await expect(
    page.getByText('tpc_668dea409daab2e5623440879050b981'),
  ).toBeVisible();
  await expect(page.getByText(/Intelopes/i)).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Public source' })).toHaveCount(
    0,
  );
  expect(errors, errors.join('\n')).toEqual([]);
});

test('atomic catalog pivots by tactic and AiTM kit', async ({ page }) => {
  await page.goto('/#atomics');

  await page.getByRole('button', { name: /By tactic/i }).click();
  await page
    .getByRole('button', { name: 'Defense Evasion', exact: true })
    .click();
  await expect(page.locator('.catalog-result-heading')).toContainText(
    'Defense Evasion',
  );
  await expect(page.locator('.atomic-card')).not.toHaveCount(0);

  await page.getByRole('button', { name: /By AiTM kit/i }).click();
  await page.getByRole('button', { name: 'Tycoon 2FA', exact: true }).click();
  await expect(page.locator('.catalog-result-heading')).toContainText(
    'Tycoon 2FA',
  );
  await expect(
    page.getByRole('link', { name: /Graph/i }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: /anomalous User-Agent/i }),
  ).toBeVisible();
});

test('atomic detail exposes executor cleanup and source-observed fidelity values', async ({
  page,
}) => {
  await page.goto('/atomics/T1078.004-suspicious-ua-signin');
  await expect(page.getByRole('heading', { name: 'Execution' })).toBeVisible();
  await expect(
    page.getByText("--user-agent '#{user_agent}'", { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cleanup' })).toBeVisible();
  await expect(page.locator('.cleanup-command')).toContainText('Remove-Item');
  await expect(page.getByText('Validation status')).toBeVisible();
  await expect(page.locator('.validation-status')).toBeVisible();
  await expect(page.locator('.validation-status')).toHaveText('partial');
  await expect(
    page.getByRole('heading', {
      name: 'Source-observed values',
    }),
  ).toBeVisible();
  await expect(
    page.getByText('axios/1.15.2 · node-fetch/1.0 · undici · node'),
  ).toBeVisible();
  await expect(
    page.getByText('A value does not make an event malicious.'),
  ).toBeVisible();
});

test('generic promoted atomics disclose validation and cleanup scope', async ({
  page,
}) => {
  await page.goto('/atomics/T1539-cookie-replay');
  await expect(
    page.getByRole('heading', { name: 'Validation criteria' }),
  ).toBeVisible();
  await expect(page.getByText('Local artifacts:')).toBeVisible();
  await expect(page.getByText('Tenant-side effects:')).toBeVisible();
  await expect(page.getByText(/does not capture a session/i)).toHaveCount(0);

  await page.goto('/atomics/T1528-oauth-consent-grant');
  await expect(page.locator('.validation-status')).toHaveText('planned');
  await expect(
    page.getByText(/not a device-authorization emulation/i),
  ).toBeVisible();
  await expect(
    page.getByText(/Manual tenant cleanup is required/i),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Validation criteria' }),
  ).toBeVisible();
});

test('primary navigation assigns one clear responsibility to each destination', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('navigation', { name: 'Primary navigation' }),
  ).toContainText('HomeCompare kitsField guidesEmulate');

  await page
    .getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('button', { name: 'Compare kits', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Compare kit behaviors' }),
  ).toBeVisible();
  await expect(
    page.getByText('Detailed attack paths live in each field guide.'),
  ).toBeVisible();
  await expect(page.locator('.infra-map')).toHaveCount(0);

  await page.getByRole('button', { name: 'Field guides', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Field guides' }),
  ).toBeVisible();
  await expect(page.locator('.infra-map')).toHaveCount(0);
  await expect(page.locator('.legend-grid')).toHaveCount(0);
});

test('new navigation preserves legacy anchors and field guides hand off to atomics', async ({
  page,
}) => {
  await page.goto('/#kit-matrix');
  await expect(
    page.getByRole('heading', { name: 'Compare kit behaviors' }),
  ).toBeVisible();
  await page.goto('/#infrastructure');
  await expect(
    page.getByRole('heading', { name: 'Field guides' }),
  ).toBeVisible();
  await page.goto('/#atomics');
  await expect(
    page.getByRole('heading', { name: 'Emulate a behavior' }),
  ).toBeVisible();

  await page.goto('/infrastructure/tycoon-2fa');
  await page
    .getByRole('button', { name: '03: Tier-1 WebSocket relay' })
    .click();
  await expect(
    page.getByRole('link', { name: 'Test this behavior' }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: '03 proxies sign-in' }).click();
  await expect(
    page.getByRole('link', { name: 'Test this behavior' }),
  ).toHaveAttribute('href', '/atomics/T1078.004-suspicious-ua-signin');
  await page.getByRole('link', { name: 'Test this behavior' }).click();
  await expect(page).toHaveURL(/\/atomics\/T1078.004-suspicious-ua-signin$/);
});

test('kit matrix and infrastructure keep distinct navigation roles', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('button', { name: 'Compare kits', exact: true })
    .click();
  await expect(
    page
      .getByRole('region', { name: 'AiTM kit convergence explorer' })
      .getByRole('link', { name: 'Open field guide' }),
  ).toHaveCount(0);

  await page.getByRole('button', { name: 'Field guides', exact: true }).click();

  const tycoon = page
    .locator('.guide-picker-card')
    .filter({ hasText: 'Tycoon 2FA' });
  await expect(
    tycoon.getByRole('link', { name: 'Open field guide' }),
  ).toHaveAttribute('href', '/infrastructure/tycoon-2fa');
  await expect(tycoon.getByRole('link')).toHaveCount(1);

  const sneaky = page
    .locator('.guide-picker-card')
    .filter({ hasText: 'Sneaky 2FA' });
  await expect(
    sneaky.getByRole('link', { name: 'Open field guide' }),
  ).toHaveAttribute('href', '/infrastructure/sneaky-2fa');

  const bigBear = page
    .locator('.guide-picker-card')
    .filter({ hasText: 'BigBear 2.0' });
  await expect(
    bigBear.getByRole('link', { name: 'Open field guide' }),
  ).toHaveCount(0);
  await expect(bigBear.getByText('Evidence gathering')).toBeVisible();
});

test('convergence explorer guides one phase at a time and preserves kit selection', async ({
  page,
}) => {
  await page.goto('/#kit-matrix');
  const explorer = page.getByRole('region', {
    name: 'AiTM kit convergence explorer',
  });

  await expect(
    explorer.getByRole('button', { name: 'Guided', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(explorer.getByText('2 kits selected')).toBeVisible();
  await expect(explorer.locator('.guided-stage')).toHaveCount(1);
  await expect(
    explorer.getByRole('heading', { name: 'Lure delivery' }),
  ).toBeVisible();
  await expect(explorer.getByText('Shared behavior')).toBeVisible();
  await expect(explorer.getByText('Kit differences')).toBeVisible();
  await expect(explorer.getByText('Defender payoff')).toBeVisible();
  await expect(
    explorer.locator('.analysis-disclosures details[open]'),
  ).toHaveCount(0);

  const bigBear = explorer.getByRole('button', {
    name: 'BigBear 2.0',
    exact: true,
  });
  await bigBear.click();
  await expect(bigBear).toHaveAttribute('aria-pressed', 'true');

  await explorer
    .getByRole('button', { name: 'Full matrix', exact: true })
    .click();
  await expect(
    explorer.getByRole('region', { name: 'Selected-kit procedure matrix' }),
  ).toBeVisible();
  await expect(
    explorer.locator('.convergence-matrix thead').getByText('BigBear 2.0'),
  ).toBeVisible();
  await expect(
    explorer.getByRole('button', { name: 'Trace Tycoon 2FA column' }),
  ).toContainText('TYC');
  await expect(
    explorer.getByRole('button', { name: 'Trace Sneaky 2FA column' }),
  ).toContainText('SNK');
  await explorer
    .getByRole('button', { name: 'Trace Sneaky 2FA column' })
    .click();
  await expect(
    explorer.getByRole('button', { name: 'Trace Sneaky 2FA column' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(explorer.locator('td.kit-column-active').first()).toContainText(
    /observed|supported|unknown|N\/A/,
  );
  await expect(
    explorer.locator('.convergence-matrix thead th').first(),
  ).toHaveCSS('position', 'sticky');
  if ((page.viewportSize()?.width ?? 0) <= 680) {
    await expect(explorer.locator('.matrix-cell-kit').first()).toBeVisible();
  } else {
    await expect(explorer.locator('.matrix-cell-kit').first()).toBeHidden();
  }
  await expect(bigBear).toHaveAttribute('aria-pressed', 'true');

  await explorer
    .getByRole('button', { name: /Inspect T1557 Adversary-in-the-Middle/i })
    .click();
  await expect(
    explorer.getByRole('heading', { name: 'Authentication mediation' }),
  ).toBeVisible();
  await explorer
    .getByRole('button', { name: 'Device Code', exact: true })
    .click();
  await expect(explorer.locator('.guided-analysis')).toContainText(
    'Device Code',
  );
  await expect(explorer.locator('.guided-analysis')).toContainText('N/A');

  await explorer
    .getByRole('button', { name: 'Credential or session acquisition' })
    .click();
  await explorer.getByRole('button', { name: /T1539/i }).click();
  await expect(
    explorer.getByRole('link', { name: /Emulate Tycoon 2FA behavior/i }),
  ).toHaveAttribute('href', '/atomics/T1539-cookie-replay');

  await explorer.getByRole('button', { name: /Reviewed only/i }).click();
  await explorer
    .getByRole('button', { name: 'Objectives and persistence' })
    .click();
  await expect(
    explorer.getByRole('button', { name: /T1098.005/i }),
  ).toBeVisible();
  await expect(
    explorer.getByRole('button', { name: 'Guided', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    explorer.getByRole('region', { name: 'Selected-kit procedure matrix' }),
  ).toHaveCount(0);
});

test('convergence handoffs require the selected kit procedure mapping', async ({
  page,
}) => {
  await page.goto('/#kit-matrix');
  const explorer = page.getByRole('region', {
    name: 'AiTM kit convergence explorer',
  });

  await explorer
    .getByRole('button', { name: 'Device Code', exact: true })
    .click();
  await explorer
    .getByRole('button', { name: 'Tycoon 2FA', exact: true })
    .click();
  await explorer
    .getByRole('button', { name: 'Sneaky 2FA', exact: true })
    .click();
  await explorer.getByRole('button', { name: 'Session or token use' }).click();
  await explorer.getByRole('button', { name: /T1078.004/i }).click();
  await expect(
    explorer.getByRole('link', { name: /Emulate .*behavior/i }),
  ).toHaveCount(0);

  await explorer
    .getByRole('button', { name: 'Credential or session acquisition' })
    .click();
  await explorer.getByRole('button', { name: /T1528/i }).click();
  await explorer.getByText('Correlation and emulation').click();
  await expect(
    explorer.getByText('No selected procedure has a promoted atomic mapping.'),
  ).toBeVisible();
});

test('shared retro typography and enlarged branding are applied', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const typography = await page.evaluate(() => ({
    brand: getComputedStyle(document.querySelector('.brand b')!).fontFamily,
    heading: getComputedStyle(document.querySelector('.hero-copy h1')!)
      .fontFamily,
    body: getComputedStyle(document.body).fontFamily,
  }));
  expect(typography.brand).toContain('Press Start 2P');
  expect(typography.heading).toContain('VT323');
  expect(typography.body).toContain('JetBrains Mono');

  const logo = await page.locator('.brand-logo').boundingBox();
  expect(logo?.width).toBeGreaterThanOrEqual(78);
});

test('legacy Tycoon dossier route resolves to the single field guide', async ({
  page,
}) => {
  await page.goto('/kits/tycoon-2fa');
  await expect(page).toHaveURL(/\/infrastructure\/tycoon-2fa$/);
  await expect(
    page.getByText('TYCOON 2FA // INFRASTRUCTURE + LURE ANATOMY'),
  ).toBeVisible();

  await page
    .getByRole('link', { name: 'Back to all kit field guides' })
    .click();
  await expect(page).toHaveURL(/\/#field-guides$/);
  await expect(
    page.getByRole('heading', { name: 'Published analyses' }),
  ).toBeVisible();
});

test('primary views avoid redundant product-tour copy', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Choose your next move' }),
  ).toBeVisible();
  await expect(page.getByText('Open view')).toHaveCount(0);

  await page.getByRole('button', { name: 'Emulate', exact: true }).click();
  await expect(page.getByText('Browse each promoted atomic')).toHaveCount(0);
  await expect(page.getByText('Start from the ATT&CK objective')).toHaveCount(
    0,
  );
  await expect(page.getByText('Open test')).toHaveCount(0);

  await page.getByRole('button', { name: 'Field guides', exact: true }).click();
  await expect(
    page.getByText('Published guides open the same three-part workflow'),
  ).toHaveCount(0);
});

test('knowledge graph and evidence lenses update their detail state', async ({
  page,
}) => {
  const errors = failOnBrowserErrors(page);
  await page.goto('/infrastructure/sneaky-2fa');

  await expect(page.locator('.kg-node .pixel-node-icon')).toHaveCount(8);
  await expect(
    page.locator('.pixel-node-icon[data-node-icon="relay"]'),
  ).toHaveCount(1);

  await expect(
    page.getByRole('heading', { name: /Follow the flow/i }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Sneaky trace' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByRole('navigation', { name: 'Sneaky 2FA trace steps' }),
  ).toContainText('01');
  await expect(
    page.getByRole('navigation', { name: 'Sneaky 2FA trace steps' }),
  ).toContainText('05');
  await expect(
    page.getByRole('navigation', { name: 'Optional modeled branches' }),
  ).toContainText('analyst-inference');
  await expect(page.locator('.node-inspector')).toContainText(
    'TRACE STEP 01 OF 05',
  );
  await expect(page.locator('.edge-flow-summary')).toContainText(
    'Lure + redirector',
  );
  await expect(page.locator('.edge-flow-summary')).toContainText(
    'redirects to',
  );
  await expect(page.locator('.edge-flow-summary')).toContainText(
    'Anti-analysis gate',
  );
  await page
    .getByRole('button', {
      name: /Identity \+ authentication state: Sneaky relay server/i,
    })
    .click();
  await expect(
    page
      .locator('.node-inspector')
      .getByRole('heading', { name: 'Identity + authentication state' }),
  ).toBeVisible();
  await expect(page.locator('.relation-payloads')).toContainText('POST /login');
  await expect(page.locator('.relation-meta')).toContainText(
    'Entra authentication events',
  );
  await expect(page.locator('.edge-flow-summary')).toContainText(
    'Tier-1 AiTM relay',
  );
  await expect(page.locator('.edge-flow-summary')).toContainText(
    'proxies authentication',
  );
  await expect(page.locator('.edge-flow-summary')).toContainText(
    'Microsoft identity',
  );
  const selectedEdgeMarker = page.getByRole('button', {
    name: /Identity \+ authentication state: Sneaky relay server/i,
  });
  const selectedEdgeBox = await selectedEdgeMarker.boundingBox();
  expect(selectedEdgeBox).not.toBeNull();
  expect(selectedEdgeBox!.width).toBeLessThanOrEqual(32);

  await page
    .getByRole('navigation', { name: 'Optional modeled branches' })
    .getByRole('button', { name: /reused by/i })
    .click();
  await expect(page.locator('.node-inspector')).toContainText(
    'MODELED BRANCH A // OPTIONAL',
  );
  await expect(page.locator('.node-inspector')).toContainText(
    'Cross-kit replay model',
  );

  await page.getByRole('button', { name: 'Topology' }).click();
  await page.getByRole('button', { name: '01: Lure + redirector' }).click();
  await expect(
    page
      .locator('.node-inspector')
      .getByRole('heading', { name: 'Lure + redirector' }),
  ).toBeVisible();

  await page.getByRole('tab', { name: 'Lure anatomy' }).click();
  await expect(
    page.getByRole('heading', { name: 'Browser, DOM, and relay traffic' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: /Enter password Credential relay/i })
    .click();
  await expect(
    page.locator('.dom-viewer code').filter({ hasText: 'validate' }).first(),
  ).toBeVisible();
  await expect(page.getByText('Microsoft identity API/login')).toBeVisible();
  await expect(
    page.getByText(
      /server—not the victim browser—starts the real Microsoft authentication flow/i,
    ),
  ).toBeVisible();
  await expect(page.locator('.evidence-render input')).toHaveCount(0);
  await page.getByRole('button', { name: /Complete MFA MFA relay/i }).click();
  await expect(
    page.getByText('Microsoft identity API/SAS/ProcessAuth'),
  ).toBeVisible();
  await expect(
    page.getByText(/Safari → Chrome → Firefox → Edge/),
  ).toBeVisible();

  const lensTabs = page.getByRole('tablist', {
    name: 'Infrastructure map lens',
  });
  await expect(lensTabs.getByRole('tab')).toHaveCount(3);
  await expect(
    lensTabs.getByRole('tab', { name: 'Scanner overlay' }),
  ).toHaveCount(0);
  await expect(
    lensTabs.getByRole('tab', { name: 'Defender view' }),
  ).toHaveCount(0);

  await page.getByRole('tab', { name: 'Reproduce the hunt' }).click();
  await expect(
    page
      .locator('.sample-record')
      .getByRole('heading', { name: 'Food-decoy deployment tuple' }),
  ).toBeVisible();
  await expect(page.locator('.sample-lens')).toContainText('Sneaky 2FA');
  await expect(page.locator('.sample-lens')).not.toContainText('Tycoon 2FA');
  await expect(page.locator('.sample-lens')).not.toContainText('BigBear 2.0');
  expect(errors, errors.join('\n')).toEqual([]);
});

test('mobile evidence sample index stays in document flow', async ({
  page,
}) => {
  test.skip((page.viewportSize()?.width ?? 0) > 680, 'Mobile regression');
  await page.goto('/infrastructure/sneaky-2fa');
  await page.getByRole('tab', { name: 'Reproduce the hunt' }).click();

  const sampleIndex = page.getByRole('navigation', {
    name: 'Evidence samples',
  });
  await expect(sampleIndex).toBeVisible();
  await expect(sampleIndex).not.toHaveCSS('position', 'fixed');

  const indexBox = await sampleIndex.boundingBox();
  const recordBox = await page.locator('.sample-record').boundingBox();
  expect(indexBox).not.toBeNull();
  expect(recordBox).not.toBeNull();
  expect(recordBox!.y).toBeGreaterThanOrEqual(
    indexBox!.y + indexBox!.height - 1,
  );
});

test('key routes avoid horizontal viewport overflow', async ({ page }) => {
  for (const path of [
    '/',
    '/kits/bigbear-2',
    '/infrastructure/sneaky-2fa',
    '/infrastructure/tycoon-2fa',
    '/atomics/T1078.004-suspicious-ua-signin',
  ]) {
    await page.goto(path);
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(
      dimensions.scrollWidth,
      `${path} overflows by ${dimensions.scrollWidth - dimensions.clientWidth}px`,
    ).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  }
});

test('key routes have no serious or critical automated accessibility violations', async ({
  page,
}) => {
  for (const path of [
    '/',
    '/infrastructure/sneaky-2fa',
    '/infrastructure/tycoon-2fa',
    '/atomics/T1078.004-suspicious-ua-signin',
  ]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(
      (violation) =>
        violation.impact === 'serious' || violation.impact === 'critical',
    );
    expect(
      blocking,
      blocking.map((item) => `${item.id}: ${item.help}`).join('\n'),
    ).toEqual([]);
  }
});

test('Tycoon field guide uses the shared contract with kit-scoped evidence', async ({
  page,
}) => {
  await page.goto('/infrastructure/tycoon-2fa');
  await expect(
    page.getByText('TYCOON 2FA // INFRASTRUCTURE + LURE ANATOMY'),
  ).toBeVisible();
  await expect(
    page.getByText(/Tacklebox evidence gate · ready/i),
  ).toBeVisible();
  await expect(page.getByText(/Intelopes/i)).toHaveCount(0);
  await expect(page.getByText('7/7 evidence dimensions passed')).toBeVisible();

  const lensTabs = page.getByRole('tablist', {
    name: 'Infrastructure map lens',
  });
  await expect(lensTabs.getByRole('tab')).toHaveCount(3);
  await expect(
    page.getByRole('button', { name: 'Tycoon trace' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByRole('navigation', { name: 'Tycoon 2FA trace steps' }),
  ).toContainText('07');
  await expect(page.locator('.node-inspector')).toContainText(
    'TRACE STEP 01 OF 07',
  );

  await page.getByRole('tab', { name: 'Lure anatomy' }).click();
  await expect(
    page.getByText('TYCOON 2FA // SOURCE-DERIVED FORENSIC WALKTHROUGH'),
  ).toBeVisible();
  await page
    .getByRole('button', { name: /Pass image check Qualification/i })
    .click();
  await expect(page.locator('.dom-viewer')).toContainText(
    'navigator.webdriver',
  );
  await expect(page.getByText('Unsplash image CDN')).toBeVisible();

  await page.getByRole('tab', { name: 'Reproduce the hunt' }).click();
  await expect(page.locator('.sample-record')).toContainText(
    'WebSocket relay controller',
  );
  await expect(page.locator('.sample-lens')).toContainText('Tycoon 2FA');
  await expect(page.locator('.sample-lens')).not.toContainText('Sneaky 2FA');
  await expect(page.locator('.sample-lens')).not.toContainText('BigBear 2.0');
});
