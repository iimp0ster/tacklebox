/* oxlint-disable next/no-html-link-for-pages, next/no-img-element -- Vinext 1.0 beta emits runtime prefetch errors for next/link on this static route. */
import type { Metadata } from 'next';
import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';
import {
  infraSources,
  tycoonDossierReadiness,
} from '../../content/infrastructure';
import TycoonInfrastructureMap from '../TycoonInfrastructureMap';
import { sitePath } from '../../../lib/site-path';

export const metadata: Metadata = {
  title: 'Tycoon 2FA infrastructure and lure anatomy — Tacklebox',
  description:
    'An evidence-bound Tycoon 2FA attack graph, lure anatomy, and reproducible passive hunt.',
};

const tycoonInfraSources = infraSources.filter((source) =>
  source.label.includes('Tycoon'),
);

export default function TycoonInfrastructurePage() {
  const gate = tycoonDossierReadiness;
  return (
    <main className="detail-site infra-detail-site">
      <header className="detail-nav">
        <a href={sitePath('/')} className="detail-brand">
          <img src={sitePath('/tacklebox-logo.png')} alt="" />
          <span>TACKLEBOX</span>
        </a>
        <a href={sitePath('/#field-guides')}>All kit field guides</a>
      </header>
      <div className="infra-map-wrap">
        <a className="back-link" href={sitePath('/#field-guides')}>
          <ArrowLeft size={16} /> Back to all kit field guides
        </a>
        <section className="infra-map-hero">
          <div>
            <p className="eyebrow">
              TYCOON 2FA // INFRASTRUCTURE + LURE ANATOMY
            </p>
            <h1>
              Follow the relay.
              <br />
              <em>Correlate the handoff.</em>
            </h1>
          </div>
          <aside className="publication-gate">
            <ShieldCheck />
            <div>
              <b>Tacklebox evidence gate · {gate.status}</b>
              <p>
                {gate.completedDimensions}/{gate.requiredDimensions} evidence
                dimensions passed · assessed {gate.assessedAt}. BAS validation
                remains a separate gate.
              </p>
            </div>
          </aside>
        </section>
        <TycoonInfrastructureMap />
        <section
          className="readiness-limitations"
          aria-labelledby="readiness-title"
        >
          <div>
            <p className="section-number">PUBLICATION RECEIPT</p>
            <h2 id="readiness-title">Evidence limits</h2>
          </div>
          <ul>
            {gate.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </section>
        <section className="infra-provenance">
          <div>
            <p className="section-number">PROVENANCE</p>
            <h2>Architecture sources</h2>
          </div>
          <div className="source-list">
            {tycoonInfraSources.map((source) => (
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
      </div>
    </main>
  );
}
