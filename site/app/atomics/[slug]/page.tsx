/* oxlint-disable next/no-html-link-for-pages, next/no-img-element -- Vinext 1.0 beta emits runtime prefetch errors for next/link on this static route. */
import type { Metadata } from 'next';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FlaskConical,
  ShieldCheck,
  TestTube2,
  TriangleAlert,
} from 'lucide-react';
import generated from '../../content/generated.json';
import { atomicTradecraftBySlug } from '../../content/atomic-tradecraft';
import { atomicValidationContracts } from '../../content/atomic-validation';
import { featuredBySlug } from '../../content/featured';
import { toPublicKitNames } from '../../content/public-kit-names';

const sourceNames: Record<string, string> = {
  entra_signin: 'Entra sign-in logs',
  graph_audit: 'Microsoft Graph audit',
  ual: 'Unified Audit Log',
  exo_audit: 'Exchange audit',
};

export function generateStaticParams() {
  return generated.atomics.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = generated.atomics.find((candidate) => candidate.slug === slug);
  return item
    ? { title: `${item.testName} — Tacklebox`, description: item.description }
    : { title: 'Atomic not found — Tacklebox' };
}

export default async function AtomicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = generated.atomics.find((candidate) => candidate.slug === slug);
  if (!item) {
    return (
      <main className="detail-site">
        <div className="detail-wrap">
          <a className="back-link" href="/#atomics">
            <ArrowLeft size={16} /> Back to atomic catalog
          </a>
          <h1>Atomic not found</h1>
        </div>
      </main>
    );
  }

  const narrative = featuredBySlug[slug];
  const tradecraft = atomicTradecraftBySlug[slug];
  const validationContract = atomicValidationContracts[slug];
  const mappedKits = toPublicKitNames([
    ...item.mappedKits,
    ...(tradecraft?.values.map((value) => value.kit) ?? []),
  ]);
  const invocation =
    narrative?.command ?? `Invoke-Tacklebox -Atomic ${item.slug} -Validate`;
  const sources = [
    ...new Map(
      [
        ...item.references.map((url) => ({
          label: new URL(url).hostname,
          url,
        })),
        ...(narrative?.sources ?? []),
      ].map((source) => [source.url, source]),
    ).values(),
  ];

  return (
    <main className="detail-site atomic-detail-site">
      <header className="detail-nav">
        <a href="/" className="detail-brand">
          <img src="/tacklebox-logo.png" alt="" />
          <span>TACKLEBOX</span>
        </a>
        <a href="/#atomics">Atomic catalog</a>
      </header>
      <div className="detail-wrap atomic-detail-wrap">
        <a className="back-link" href="/#atomics">
          <ArrowLeft size={16} /> Back to atomic catalog
        </a>

        <section className="detail-hero atomic-test-hero">
          <div>
            <p className="eyebrow">
              {`${item.phase.toUpperCase()} // PROMOTED ATOMIC`}
            </p>
            <span className="detail-technique">{item.technique}</span>
            <h1>{item.testName}</h1>
            <p className="detail-summary">{item.description}</p>
          </div>
          <aside className="provenance-card">
            <p>TEST CONTRACT</p>
            <dl>
              <div>
                <dt>Fidelity</dt>
                <dd className="warn">{item.fidelity}</dd>
              </div>
              <div>
                <dt>Executor</dt>
                <dd>{item.executor}</dd>
              </div>
              <div>
                <dt>Platforms</dt>
                <dd>{item.supportedPlatforms.join(' · ')}</dd>
              </div>
              <div>
                <dt>Cleanup</dt>
                <dd className={item.hasCleanup ? 'good' : 'warn'}>
                  {item.hasCleanup ? 'defined' : 'missing'}
                </dd>
              </div>
              <div>
                <dt>Validation status</dt>
                <dd className="validation-status">
                  {validationContract?.status ?? 'not published'}
                </dd>
              </div>
              <div>
                <dt>Auth profile</dt>
                <dd>{item.authProfile}</dd>
              </div>
              <div>
                <dt>Validation provenance</dt>
                <dd>
                  {validationContract?.provenance ??
                    'No atomic-specific validation contract is published.'}
                </dd>
              </div>
            </dl>
          </aside>
        </section>

        <section className="detail-section atomic-purpose-grid">
          <div>
            <p className="section-number">01 // TRADECRAFT MAPPING</p>
            <h2>Tradecraft mapping</h2>
            <p>{narrative?.why ?? item.description}</p>
          </div>
          <aside className="atomic-kit-map">
            <span>TECHNIQUE-LEVEL KIT MAPPING</span>
            {mappedKits.length ? (
              <div className="kit-tags">
                {mappedKits.map((kit) => (
                  <span key={kit}>{kit}</span>
                ))}
              </div>
            ) : (
              <p>No reviewed kit mapping yet.</p>
            )}
            <small>
              A kit mapping means the technique is reported for that kit. It
              does not prove every variant executes this exact atomic
              implementation.
            </small>
          </aside>
        </section>

        <section className="detail-section">
          <p className="section-number">02 // EXECUTION</p>
          <h2>Execution</h2>
          <div className="lab-warning">
            <ShieldCheck size={18} />
            <p>
              <b>Controlled tenant only.</b> Tacklebox blocks execution against
              an unlabeled tenant.
            </p>
          </div>
          <div className="command-label">
            <span>TACKLEBOX INVOCATION</span>
            <code>PowerShell 7.2+</code>
          </div>
          <pre className="command-block">
            <code>{invocation}</code>
          </pre>
          <div className="command-label">
            <span>UNDERLYING EXECUTOR</span>
            <code>{item.executor}</code>
          </div>
          <pre className="command-block executor-command">
            <code>{item.executorCommand}</code>
          </pre>
        </section>

        <section className="detail-section atomic-input-section">
          <div>
            <p className="section-number">03 // INPUTS</p>
            <h2>Inputs</h2>
          </div>
          <div className="atomic-input-table">
            {item.inputArguments.map((input) => (
              <div className="atomic-input-row" key={input.name}>
                <code>{input.name}</code>
                <span>{input.type}</span>
                <p>{input.description}</p>
                <code>{input.default}</code>
              </div>
            ))}
          </div>
        </section>

        <section className="detail-section cleanup-section">
          <div>
            <p className="section-number">04 // CLEANUP</p>
            <h2>Cleanup</h2>
            <p>Run after success, failure, or interruption.</p>
          </div>
          <pre className="command-block cleanup-command">
            <code>
              {item.cleanupCommand || 'No cleanup command is declared.'}
            </code>
          </pre>
          <div className="cleanup-scope">
            <p>
              <b>Local artifacts:</b>{' '}
              {validationContract?.cleanup.local ??
                'No atomic-specific cleanup contract is published.'}
            </p>
            <p>
              <b>Tenant-side effects:</b>{' '}
              {validationContract?.cleanup.tenant ??
                'Review tenant-side effects before ending the lab run.'}
            </p>
          </div>
        </section>

        <section className="detail-section">
          <p className="section-number">05 // EXPECTED EVIDENCE</p>
          <h2>Expected telemetry</h2>
          <div className="telemetry-grid">
            {(
              narrative?.telemetry ??
              validationContract?.telemetry ??
              item.telemetrySources.map((source) => ({
                source: sourceNames[source] ?? source,
                signals: [
                  'Atomic-specific match is defined in the source YAML',
                  'Correlate with the shared Tacklebox run ID and execution window',
                ],
                window: 'declared observation window',
              }))
            ).map((group) => (
              <article key={group.source}>
                <div className="telemetry-head">
                  <CheckCircle2 />
                  <h3>{group.source}</h3>
                  <span>{group.window}</span>
                </div>
                <ul>
                  {group.signals.map((signal) => (
                    <li key={signal}>{signal}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="detail-section validation-contract-section">
          <p className="section-number">06 // VALIDATION CONTRACT</p>
          <h2>Validation criteria</h2>
          {validationContract ? (
            <dl className="validation-contract-grid">
              <div>
                <dt>Query / correlation</dt>
                <dd>{validationContract.validation.query}</dd>
              </div>
              <div>
                <dt>Pass</dt>
                <dd>{validationContract.validation.pass}</dd>
              </div>
              <div>
                <dt>Fail</dt>
                <dd>{validationContract.validation.fail}</dd>
              </div>
            </dl>
          ) : (
            <p>
              No atomic-specific validation receipt is published for this test.
            </p>
          )}
        </section>

        <section className="detail-section tradecraft-fidelity-section">
          <div className="tradecraft-fidelity-heading">
            <div>
              <p className="section-number">07 // SOURCE-OBSERVED FIDELITY</p>
              <h2>Source-observed values</h2>
            </div>
            <span className="evidence-badge">
              <FlaskConical size={15} /> STRUCTURAL VALUES ONLY
            </span>
          </div>
          <div className="fidelity-safety-note">
            <TriangleAlert size={18} />
            <p>
              <b>A value does not make an event malicious.</b> These
              substitutions make the test resemble source-observed behavior.
              Detection confidence comes from the value plus sequence, identity,
              application, timing, and infrastructure context.
            </p>
          </div>
          {tradecraft ? (
            <>
              <p className="tradecraft-summary">{tradecraft.summary}</p>
              <div className="fidelity-value-grid">
                {tradecraft.values.map((value) => (
                  <article key={value.input}>
                    <div className="fidelity-value-head">
                      <code>{value.input}</code>
                      <span
                        className={value.status === 'ready' ? 'ready' : 'gap'}
                      >
                        {value.status === 'ready'
                          ? 'usable input'
                          : 'atomic gap'}
                      </span>
                    </div>
                    <dl>
                      <div>
                        <dt>Lab default</dt>
                        <dd>{value.labDefault}</dd>
                      </div>
                      <div>
                        <dt>Source-observed</dt>
                        <dd>{value.sourceObserved}</dd>
                      </div>
                      <div>
                        <dt>Reported kit</dt>
                        <dd>{value.kit}</dd>
                      </div>
                      <div>
                        <dt>Fidelity effect</dt>
                        <dd>{value.effect}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
              <a
                className="source-evidence-link"
                href={tradecraft.source.url}
                target="_blank"
                rel="noreferrer"
              >
                Evidence source: {tradecraft.source.label}
                <ExternalLink size={14} />
              </a>
            </>
          ) : (
            <div className="fidelity-empty">
              <FlaskConical />
              <div>
                <h3>No approved source-observed substitution yet</h3>
                <p>
                  No reviewed substitution is available. Use the safe defaults.
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="detail-section two-col analysis-grid">
          <div>
            <p className="section-number">08 // DEFENDER USE</p>
            <h2>Detection use</h2>
            <p>
              {narrative?.detection ??
                `Validate that ${item.telemetrySources.map((source) => sourceNames[source] ?? source).join(' and ')} receives the expected observation before evaluating the detection.`}
            </p>
          </div>
          <div>
            <p className="section-number">09 // EMULATION DELTA</p>
            <h2>Limits</h2>
            <ul className="limitation-list">
              {(
                narrative?.limitations ?? [
                  'A successful run does not attribute activity to a kit.',
                  'Technique-level kit mapping does not prove implementation-level equivalence.',
                  'A sensor may require manual or delayed validation.',
                ]
              ).map((limit) => (
                <li key={limit}>
                  <TriangleAlert size={16} />
                  <span>{limit}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="detail-section">
          <p className="section-number">10 // PROVENANCE</p>
          <h2>Sources</h2>
          <div className="source-list">
            {item.chokepointUrl && (
              <a href={item.chokepointUrl} target="_blank" rel="noreferrer">
                <span>Detection chokepoint: {item.chokepointId}</span>
                <ExternalLink size={15} />
              </a>
            )}
            {sources.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noreferrer"
              >
                <span>{source.label}</span>
                <ExternalLink size={15} />
              </a>
            ))}
          </div>
        </section>

        <nav className="detail-next" aria-label="Other atomic tests">
          {generated.atomics
            .filter((other) => other.slug !== item.slug)
            .slice(0, 3)
            .map((other) => (
              <a href={`/atomics/${other.slug}`} key={other.slug}>
                <TestTube2 />
                <span>
                  <small>{other.technique}</small>
                  {other.testName}
                </span>
                <ArrowRight />
              </a>
            ))}
        </nav>
      </div>
    </main>
  );
}
