/* oxlint-disable next/no-img-element -- Vinext static routes use the public pixel logo directly. */
'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Box,
  Code2,
  ExternalLink,
  ShieldCheck,
  TestTube2,
} from 'lucide-react';
import generated from './content/generated.json';
import { atomicTradecraftBySlug } from './content/atomic-tradecraft';
import { kitGuideEntries } from './content/kit-guides';
import { toPublicKitNames } from './content/public-kit-names';
import AtomicCatalog, { type PublicAtomic } from './AtomicCatalog';
import KitConvergenceExplorer from './KitConvergenceExplorer';
import { sitePath } from '../lib/site-path';

const evidenceClaims = generated.evidenceClaims ?? [];
const publicAtomics = generated.atomics.map((item) => ({
  ...item,
  mappedKits: toPublicKitNames([
    ...item.mappedKits,
    ...(atomicTradecraftBySlug[item.slug]?.values.map((value) => value.kit) ??
      []),
  ]),
}));

const views = ['Home', 'Compare kits', 'Field guides', 'Emulate'] as const;
type View = (typeof views)[number];
const viewByHash: Record<string, View> = {
  '#home': 'Home',
  '#atlas': 'Home',
  '#compare-kits': 'Compare kits',
  '#kit-matrix': 'Compare kits',
  '#field-guides': 'Field guides',
  '#infrastructure': 'Field guides',
  '#emulate': 'Emulate',
  '#atomics': 'Emulate',
};

function MiniFlow() {
  const nodes = ['Intel', 'Emulation', 'Telemetry', 'Detection'];
  return (
    <div
      className="mini-flow"
      aria-label="Practitioner path from intel to detection"
    >
      {nodes.map((node, index) => (
        <div className="mini-flow-step" key={node}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <strong>{node}</strong>
          {index < nodes.length - 1 && <ArrowRight aria-hidden="true" />}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>('Home');

  useEffect(() => {
    const openLinkedView = () => {
      const linkedView = viewByHash[window.location.hash];
      if (linkedView) setView(linkedView);
    };
    openLinkedView();
    window.addEventListener('hashchange', openLinkedView);
    return () => window.removeEventListener('hashchange', openLinkedView);
  }, []);

  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options?: { signal?: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: 'navigate_tacklebox_view',
          title: 'Open Tacklebox view',
          description:
            'Open one of the visible Tacklebox views: Home, Compare kits, Field guides, or Emulate.',
          inputSchema: {
            type: 'object',
            properties: { view: { type: 'string', enum: views } },
            required: ['view'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input: unknown) {
            const next = (input as { view?: string })?.view;
            if (!views.includes(next as View))
              throw new Error('Unknown Tacklebox view');
            setView(next as View);
            return { view: next };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  return (
    <main>
      <header className="site-nav">
        <button
          className="brand"
          onClick={() => setView('Home')}
          aria-label="Open Tacklebox home"
        >
          <img className="brand-logo" src={sitePath('/tacklebox-logo.png')} alt="" />
          <span>
            <b>TACKLEBOX</b>
            <small>AiTM FIELD GUIDE</small>
          </span>
        </button>
        <nav aria-label="Primary navigation">
          {views.map((item) => (
            <button
              key={item}
              className={view === item ? 'active' : ''}
              onClick={() => setView(item)}
            >
              {item}
            </button>
          ))}
        </nav>
        <a
          className="github-link"
          href="https://github.com/iimp0ster/tacklebox"
          target="_blank"
          rel="noreferrer"
          aria-label="Tacklebox GitHub repository"
        >
          <Code2 size={17} /> <span>GitHub</span>
        </a>
      </header>
      <div className="safety-strip">
        <ShieldCheck size={15} />
        <b>LAB ONLY</b>
        <span>Tacklebox refuses to run against an unlabeled tenant.</span>
      </div>

      {view === 'Home' && (
        <div className="page-shell atlas">
          <section className="hero-grid">
            <div className="hero-copy">
              <img
                className="hero-logo"
                src={sitePath('/tacklebox-logo.png')}
                alt="Tacklebox — AiTM Lab Harness"
              />
              <p className="eyebrow">
                OPEN DEFENSIVE RESEARCH // V1 FIELD NOTES
              </p>
              <h1>
                Understand the kit.
                <br />
                Run the behavior.
                <br />
                <em>Validate the signal.</em>
              </h1>
              <p className="lede">
                Trace publication-safe kit tradecraft to a lab-safe atomic, then
                observe the expected telemetry and validate the detection.
              </p>
              <div className="hero-actions">
                <button
                  className="button-primary"
                  onClick={() => setView('Emulate')}
                >
                  <TestTube2 size={18} /> Start an emulation
                </button>
                <button
                  className="button-secondary"
                  onClick={() => setView('Compare kits')}
                >
                  <Activity size={18} /> Compare kits
                </button>
              </div>
            </div>
            <div className="console-panel">
              <div className="console-title">
                <span>TACKLEBOX / EMULATION LOOP</span>
                <span className="live-dot">READY</span>
              </div>
              <MiniFlow />
              <div className="console-readout">
                <span>
                  <b>INTEL</b> select a reviewed behavior
                </span>
                <span>
                  <b>EMULATE</b> run one lab-safe atomic
                </span>
                <span>
                  <b>DETECT</b> validate expected telemetry
                </span>
              </div>
              <div className="prompt">
                <span>PS&gt;</span> Invoke-Tacklebox -Atomic
                T1087.004-graph-enumeration -Validate<i>_</i>
              </div>
            </div>
          </section>
          <section className="metric-row" aria-label="Project coverage summary">
            <div>
              <strong>{generated.stats.atomics}</strong>
              <span>promoted atomics</span>
            </div>
            <div>
              <strong>{generated.stats.kits}</strong>
              <span>kit and behavior profiles</span>
            </div>
            <div>
              <strong>{generated.stats.telemetrySources}</strong>
              <span>telemetry sources</span>
            </div>
            <div>
              <strong>{generated.stats.safetyGate}</strong>
              <span>lab-gated execution</span>
            </div>
          </section>
          <section className="section-block">
            <div className="section-heading">
              <div>
                <p className="eyebrow">START HERE</p>
                <h2>Choose your next move</h2>
              </div>
            </div>
            <div className="angle-grid">
              {[
                [
                  'Compare kits',
                  Activity,
                  'Find overlap and chokepoints',
                  'Compare kits',
                ],
                [
                  'Field guides',
                  Box,
                  'Study one kit’s graph and lure anatomy',
                  'Field guides',
                ],
                [
                  'Emulate',
                  TestTube2,
                  'Run a lab-safe atomic and validate it',
                  'Emulate',
                ],
              ].map(([title, Icon, purpose, target], index) => (
                <button
                  className="angle-card"
                  key={String(title)}
                  onClick={() => setView(target as View)}
                >
                  <span className="card-index">0{index + 1}</span>
                  <Icon size={25} />
                  <h3>{String(title)}</h3>
                  <b>{String(purpose)}</b>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {view === 'Emulate' && (
        <div className="page-shell" id="emulate">
          <header className="page-header">
            <p className="eyebrow">
              LAB-SAFE ATOMIC TESTS // GENERATED FROM REPOSITORY
            </p>
            <h1>Emulate a behavior</h1>
            <p>
              Choose one atomic test, review its tradecraft boundary, run it in
              a labeled lab tenant, then validate the declared telemetry.
            </p>
          </header>
          <AtomicCatalog atomics={publicAtomics as PublicAtomic[]} />
        </div>
      )}

      {view === 'Compare kits' && (
        <div className="page-shell kit-matrix-page">
          <header className="page-header">
            <p className="eyebrow">COMPARE // EVIDENCE-BOUND CONVERGENCE</p>
            <h1>Compare kit behaviors</h1>
            <p>
              Find overlap, implementation differences, evidence strength, and
              reusable defender chokepoints. Detailed attack paths live in each
              field guide.
            </p>
          </header>
          <KitConvergenceExplorer />
        </div>
      )}

      {view === 'Field guides' && (
        <div className="page-shell" id="field-guides">
          <header className="page-header">
            <p className="eyebrow">KIT-SPECIFIC RESEARCH</p>
            <h1>Field guides</h1>
            <p>
              Open a published kit guide for its evidence-bound attack graph and
              lure anatomy. Publication state and the evidence ledger stay here.
            </p>
          </header>
          <section
            className="guide-picker"
            aria-labelledby="guide-picker-title"
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">KIT FIELD GUIDES</p>
                <h2 id="guide-picker-title">Published analyses</h2>
              </div>
            </div>
            <div className="guide-picker-grid">
              {kitGuideEntries.map((guide, index) => (
                <article
                  className={`guide-picker-card ${guide.status === 'published' ? 'guide-ready' : 'guide-waiting'}`}
                  key={guide.kitName}
                >
                  <div className="guide-picker-head">
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <span
                      className={`guide-status guide-status-${guide.status}`}
                    >
                      {guide.status === 'published'
                        ? 'Published'
                        : 'Evidence gathering'}
                    </span>
                  </div>
                  <h3>{guide.kitName}</h3>
                  <p>{guide.summary}</p>
                  {guide.fieldGuideRoute && (
                    <div className="guide-picker-actions">
                      <a
                        className="button-primary"
                        href={sitePath(guide.fieldGuideRoute)}
                      >
                        Open field guide <ArrowRight size={15} />
                      </a>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
          <section
            className="evidence-ledger"
            aria-labelledby="evidence-ledger-title"
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">TACKLEBOX EVIDENCE</p>
                <h2 id="evidence-ledger-title">Reviewed evidence ledger</h2>
              </div>
              <p>
                Static, revision-bound claims only. Exact indicators remain
                outside the public site.
              </p>
            </div>
            <div className="evidence-ledger-grid">
              {evidenceClaims.map((claim) => {
                const isFixture = claim.evidence_class === 'synthetic_fixture';
                const chokepointSlug = claim.chokepoint_ref.replace(
                  'detection-chokepoints/',
                  '',
                );
                const evidenceDate =
                  claim.time_basis === 'observed'
                    ? claim.observed_date
                    : claim.source_published_date;
                return (
                  <article key={claim.claim_id}>
                    <div className="evidence-ledger-head">
                      <span>{claim.kit_id}</span>
                      <span
                        className={`status status-${claim.confidence === 'high' ? 'strong' : 'draft'}`}
                      >
                        {claim.confidence}
                      </span>
                    </div>
                    <h3>{claim.behavior_id.replaceAll('-', ' ')}</h3>
                    <p>{claim.caveat}</p>
                    <dl>
                      <div>
                        <dt>Relationship</dt>
                        <dd>
                          {claim.role} → {claim.direction.replaceAll('_', ' ')}
                        </dd>
                      </div>
                      <div>
                        <dt>Evidence</dt>
                        <dd>
                          {isFixture
                            ? 'compatibility fixture'
                            : claim.evidence_class.replaceAll('_', ' ')}
                        </dd>
                      </div>
                      <div>
                        <dt>
                          {claim.time_basis === 'observed'
                            ? 'Observed'
                            : 'Source published'}
                        </dt>
                        <dd>{evidenceDate}</dd>
                      </div>
                      <div>
                        <dt>Maturity</dt>
                        <dd>{claim.detection_tier}</dd>
                      </div>
                    </dl>
                    <div className="evidence-ledger-links">
                      <a
                        href={`https://iimp0ster.github.io/detection-chokepoints/chokepoints/${chokepointSlug}/`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Detection chokepoint <ExternalLink size={13} />
                      </a>
                      {!isFixture && claim.provenance.source_url && (
                        <a
                          href={claim.provenance.source_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Public source <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                    <code>{claim.claim_id}</code>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}

      <footer>
        <div className="footer-brand">
          <img src={sitePath('/tacklebox-logo.png')} alt="" />
          <span>TACKLEBOX // DEFENSIVE RESEARCH</span>
        </div>
        <p>Isolated lab tenants only.</p>
        <a
          href="https://iimp0ster.github.io/detection-chokepoints/"
          target="_blank"
          rel="noreferrer"
        >
          Detection Chokepoints <ExternalLink size={13} />
        </a>
      </footer>
    </main>
  );
}
