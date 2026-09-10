'use client';

import { useState } from 'react';
import {
  ArrowRight,
  ExternalLink,
  Eye,
  FileCode2,
  LockKeyhole,
  Mail,
  Network,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { sneakyLureStages, type LureStage } from '../content/infrastructure';

function RenderedSurface({ stage }: { stage: LureStage }) {
  if (stage.surface === 'message') {
    return (
      <div className="evidence-message">
        <div>
          <Mail />
          <span>OUTLOOK MESSAGE</span>
        </div>
        <dl>
          <div>
            <dt>Subject</dt>
            <dd>ACH Remit Status Notification</dd>
          </div>
          <div>
            <dt>Attachment</dt>
            <dd>ACH_Payment_Remittance…html</dd>
          </div>
        </dl>
        <p>
          A payment document associated with your account is ready for review.
        </p>
        <span className="evidence-cta">Open attachment</span>
      </div>
    );
  }

  if (stage.surface === 'redirect') {
    return (
      <div className="evidence-document">
        <div className="document-photo" aria-hidden="true">
          <span>Mortgage servicing</span>
        </div>
        <div>
          <small>DOCUMENT CENTER</small>
          <h3>Your document is ready</h3>
          <p>Review the assessment associated with this payment.</p>
          <span className="evidence-cta">View document</span>
        </div>
      </div>
    );
  }

  if (stage.surface === 'decoy') {
    return (
      <div className="evidence-food">
        <small>GOURMET DELIGHTS AND BEVERAGE</small>
        <h3>Seasonal favorites</h3>
        <p>Fresh recipes and simple meals for every table.</p>
        <div>
          <span>Breakfast</span>
          <span>Desserts</span>
          <span>Drinks</span>
        </div>
        <aside>
          <ShieldCheck />
          <b>Checking your browser…</b>
        </aside>
      </div>
    );
  }

  if (stage.surface === 'captcha') {
    return (
      <div className="evidence-captcha">
        <small>SECURITY CHECK</small>
        <h3>Select every matching image</h3>
        <div aria-hidden="true">
          {Array.from({ length: 9 }, (_, index) => (
            <span key={index}>{String(index + 1).padStart(2, '0')}</span>
          ))}
        </div>
        <p>Safe reconstruction · external image requests removed</p>
      </div>
    );
  }

  if (stage.surface === 'signin') {
    return (
      <div className="evidence-signin">
        <b>
          <i />
          <i />
          <i />
          <i /> Microsoft
        </b>
        <h3>Sign in</h3>
        <code>analyst@example.test</code>
        <div className="fake-field">••••••••••••</div>
        <span className="evidence-cta">Sign in</span>
        <p>Source-derived render · fields are inert</p>
      </div>
    );
  }

  if (stage.surface === 'mfa') {
    return (
      <div className="evidence-signin">
        <b>
          <i />
          <i />
          <i />
          <i /> Microsoft
        </b>
        <h3>Approve sign in request</h3>
        <strong>42</strong>
        <p>Open Microsoft Authenticator and enter the number shown.</p>
        <span className="evidence-cta">I&apos;ve approved</span>
        <p>Source-derived render · control is inert</p>
      </div>
    );
  }

  return (
    <div className="evidence-complete">
      <LockKeyhole />
      <h3>Authentication complete</h3>
      <p>
        The victim-facing browser is sent to a legitimate Microsoft destination.
        Session capture is not visible here.
      </p>
    </div>
  );
}

type LureAnatomyProps = {
  kitName: string;
  stages: LureStage[];
  relayLabel: string;
  sourceBasis: string;
  sources: { label: string; url: string }[];
};

export function KitLureAnatomy({
  kitName,
  stages,
  relayLabel,
  sourceBasis,
  sources,
}: LureAnatomyProps) {
  const [stageId, setStageId] = useState(stages[0].id);
  const stageIndex = Math.max(
    0,
    stages.findIndex((item) => item.id === stageId),
  );
  const stage = stages[stageIndex];
  const nextStage = stages[Math.min(stageIndex + 1, stages.length - 1)];

  return (
    <section className="lure-anatomy" aria-labelledby="lure-anatomy-title">
      <header className="anatomy-header">
        <div>
          <p className="section-number">
            {kitName.toUpperCase()}
            {' // SOURCE-DERIVED FORENSIC WALKTHROUGH'}
          </p>
          <h2 id="lure-anatomy-title">Browser, DOM, and relay traffic</h2>
        </div>
        <div className="anatomy-status">
          <ShieldCheck />
          <span>
            <b>Non-functional specimen</b>No input is accepted or transmitted
          </span>
        </div>
      </header>

      <nav className="anatomy-trace" aria-label="Simulated observer actions">
        {stages.map((item) => (
          <button
            key={item.id}
            aria-current={item.id === stage.id ? 'step' : undefined}
            onClick={() => setStageId(item.id)}
          >
            <span>{item.step}</span>
            <b>{item.action}</b>
            <small>{item.phase}</small>
          </button>
        ))}
      </nav>

      <div className="forensic-workbench">
        <section
          className="evidence-browser"
          aria-label={`${stage.action} source-derived render`}
        >
          <header>
            <div>
              <i />
              <i />
              <i />
            </div>
            <code>{stage.address}</code>
            <span>CAPTURE</span>
          </header>
          <div className="evidence-render">
            <div className="render-watermark">SAFE RECONSTRUCTION</div>
            <RenderedSurface stage={stage} />
          </div>
          <footer>
            <Eye />
            <span>Victim-visible surface</span>
            <b>{stage.phase}</b>
          </footer>
        </section>

        <section
          className="evidence-underhood"
          aria-label="Synchronized technical evidence"
        >
          <div className="evidence-pane-head">
            <span>
              <FileCode2 /> {stage.domLanguage}
            </span>
            <b>{stage.evidence.replace('-', ' ')}</b>
          </div>
          <section
            className="dom-viewer"
            aria-label={`${stage.action} code excerpt`}
          >
            {stage.dom.map((item) => (
              <div
                key={`${stage.id}-${item.line}`}
                className={item.active ? 'active' : ''}
              >
                <span>{item.line}</span>
                <code>{item.code}</code>
              </div>
            ))}
          </section>

          <div className="evidence-pane-head">
            <span>
              <Network /> Request flow
            </span>
            <b>
              {stage.requests.length} observed relationship
              {stage.requests.length === 1 ? '' : 's'}
            </b>
          </div>
          <div className="connection-rail" aria-label="Connection roles">
            <span className="active">Victim browser</span>
            <ArrowRight />
            <span className="active">{relayLabel}</span>
            <ArrowRight />
            <span
              className={
                stage.requests.some((item) => item.channel === 'relay')
                  ? 'active'
                  : ''
              }
            >
              Microsoft identity
            </span>
          </div>
          <div className="request-waterfall">
            {stage.requests.map((request, index) => (
              <article key={`${stage.id}-${request.offset}-${request.path}`}>
                <span>{request.offset}</span>
                <b className={`request-channel ${request.channel}`}>
                  {request.channel}
                </b>
                <strong>{request.method}</strong>
                <code>
                  {request.destination}
                  {request.path}
                </code>
                <em>{request.status}</em>
                <div className="waterfall-line">
                  <i style={{ width: `${Math.max(28, 92 - index * 17)}%` }} />
                </div>
                <p>{request.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="anatomy-analysis" aria-live="polite">
        <div>
          <span>What this step establishes</span>
          <p>{stage.finding}</p>
        </div>
        <div>
          <span>Defender pivot</span>
          <p>{stage.hunt}</p>
        </div>
        <div>
          <TriangleAlert />
          <span>Evidence boundary</span>
          <p>{stage.boundary}</p>
        </div>
      </section>

      <footer className="anatomy-footer">
        <p>
          <b>Source basis:</b> {sourceBasis} Displayed values are masked or
          synthetic.
        </p>
        <div>
          <button
            disabled={stage.id === stages.at(-1)?.id}
            onClick={() => setStageId(nextStage.id)}
          >
            Next step <ArrowRight />
          </button>
          {sources.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noreferrer"
            >
              {source.label} <ExternalLink />
            </a>
          ))}
        </div>
      </footer>
    </section>
  );
}

export default function SneakyLureAnatomy() {
  return (
    <KitLureAnatomy
      kitName="Sneaky 2FA"
      stages={sneakyLureStages}
      relayLabel="Sneaky relay"
      sourceBasis="DOM and relay choreography from Sekoia's source-code analysis; delivery and network relationships from Zeltoc's public sandbox case."
      sources={[
        {
          label: 'Technical source',
          url: 'https://www.sekoia.com/blog/sneaky-2fa-exposing-a-new-aitm-phishing-as-a-service',
        },
        {
          label: 'Campaign evidence',
          url: 'https://github.com/Zeltoc/phishing-analysis-sneaky2fa-aitm',
        },
      ]}
    />
  );
}
