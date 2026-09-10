'use client';

import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FlaskConical,
  GitCompareArrows,
  Grid3X3,
  ShieldAlert,
} from 'lucide-react';
import {
  convergenceRecords,
  kitProfiles,
  lifecyclePhases,
  type Applicability,
  type ConvergenceRecord,
} from './content/kit-convergence';
import { getProcedureAtomicMapping } from './content/atomic-mappings';
import { sitePath } from '../lib/site-path';

type Mode = 'guided' | 'matrix';

const supportedStates: Applicability[] = ['observed', 'supported'];

function stateLabel(state: Applicability) {
  return state === 'not-applicable' ? 'N/A' : state;
}

export default function KitConvergenceExplorer() {
  const [mode, setMode] = useState<Mode>('guided');
  const [selectedKits, setSelectedKits] = useState(['tycoon', 'sneaky']);
  const [reviewedOnly, setReviewedOnly] = useState(true);
  const [activePhase, setActivePhase] = useState('Lure delivery');
  const [focusedId, setFocusedId] = useState('T1566.002');
  const [tracedKitId, setTracedKitId] = useState<string | null>(null);
  const [hoveredKitId, setHoveredKitId] = useState<string | null>(null);

  const records = useMemo(
    () =>
      convergenceRecords.filter(
        (record) => !reviewedOnly || record.reviewState === 'reviewed',
      ),
    [reviewedOnly],
  );
  const selectedProfiles = kitProfiles.filter((kit) =>
    selectedKits.includes(kit.id),
  );
  const phaseRecords = records.filter((record) => record.phase === activePhase);
  const focused =
    phaseRecords.find((record) => record.id === focusedId) ??
    phaseRecords[0] ??
    records[0];
  const phaseIndex = lifecyclePhases.indexOf(activePhase);
  const procedureAtomics = focused.procedures
    .filter(
      (procedure) =>
        selectedKits.includes(procedure.kitId) &&
        supportedStates.includes(procedure.applicability),
    )
    .flatMap((procedure) => {
      const mapping = getProcedureAtomicMapping(focused.id, procedure.kitId);
      return mapping ? [{ procedure, mapping }] : [];
    });

  function toggleKit(kitId: string) {
    setSelectedKits((current) => {
      if (current.includes(kitId)) {
        return current.length === 1
          ? current
          : current.filter((id) => id !== kitId);
      }
      return [...current, kitId];
    });
  }

  function selectPhase(phase: string) {
    setActivePhase(phase);
    const first = records.find((record) => record.phase === phase);
    if (first) setFocusedId(first.id);
  }

  function inspectFromMatrix(record: ConvergenceRecord) {
    setActivePhase(record.phase);
    setFocusedId(record.id);
    setMode('guided');
  }

  function coverage(record: ConvergenceRecord) {
    const selected = record.procedures.filter((item) =>
      selectedKits.includes(item.kitId),
    );
    return {
      supported: selected.filter((item) =>
        supportedStates.includes(item.applicability),
      ).length,
      unknown: selected.filter((item) => item.applicability === 'unknown')
        .length,
      notApplicable: selected.filter(
        (item) => item.applicability === 'not-applicable',
      ).length,
      total: selected.length,
    };
  }

  function coverageText(record: ConvergenceRecord) {
    const count = coverage(record);
    if (count.total === 1) {
      const procedure = record.procedures.find(
        (item) => item.kitId === selectedKits[0],
      );
      return procedure ? stateLabel(procedure.applicability) : 'unknown';
    }
    return `${count.supported}/${count.total} selected kits`;
  }

  return (
    <section
      className="convergence-explorer guided-convergence"
      aria-label="AiTM kit convergence explorer"
    >
      <div className="convergence-toolbar guided-toolbar">
        <div className="guided-filter-block">
          <p className="guided-step-label">01 / CHOOSE KITS</p>
          <fieldset className="kit-filter-bar">
            <legend className="visually-hidden">
              Filter convergence by kit
            </legend>
            {kitProfiles.map((kit) => (
              <button
                key={kit.id}
                type="button"
                aria-pressed={selectedKits.includes(kit.id)}
                onClick={() => toggleKit(kit.id)}
                style={{ '--kit-color': kit.color } as CSSProperties}
              >
                <span className="kit-filter-marker" aria-hidden="true">
                  {kit.marker}
                </span>
                {kit.name}
              </button>
            ))}
          </fieldset>
          <span className="selection-count">
            {selectedProfiles.length} kit
            {selectedProfiles.length === 1 ? '' : 's'} selected
          </span>
        </div>
        <div className="convergence-controls guided-controls">
          <fieldset className="mode-switch">
            <legend className="visually-hidden">Convergence view</legend>
            <button
              type="button"
              aria-pressed={mode === 'guided'}
              onClick={() => setMode('guided')}
            >
              <GitCompareArrows size={16} />
              Guided
            </button>
            <button
              type="button"
              aria-pressed={mode === 'matrix'}
              onClick={() => setMode('matrix')}
            >
              <Grid3X3 size={16} />
              Full matrix
            </button>
          </fieldset>
          <button
            className="review-filter"
            type="button"
            aria-pressed={reviewedOnly}
            onClick={() => setReviewedOnly((value) => !value)}
          >
            <Check size={15} />
            Reviewed only
          </button>
        </div>
      </div>

      {mode === 'guided' ? (
        <div className="guided-workspace">
          <div className="guided-phase-block">
            <p className="guided-step-label">02 / FOLLOW THE CHAIN</p>
            <nav className="phase-rail" aria-label="AiTM lifecycle phases">
              {lifecyclePhases.map((phase, index) => (
                <button
                  key={phase}
                  type="button"
                  aria-current={phase === activePhase ? 'step' : undefined}
                  onClick={() => selectPhase(phase)}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{phase}</strong>
                </button>
              ))}
            </nav>
          </div>

          <section
            className="guided-stage"
            aria-labelledby="active-phase-title"
          >
            <header className="guided-stage-header">
              <div>
                <span>
                  TACKLEBOX AITM PHASE {String(phaseIndex + 1).padStart(2, '0')}
                </span>
                <h2 id="active-phase-title">{activePhase}</h2>
              </div>
              <div className="phase-arrows">
                <button
                  type="button"
                  disabled={phaseIndex === 0}
                  aria-label="Previous lifecycle phase"
                  onClick={() => selectPhase(lifecyclePhases[phaseIndex - 1])}
                >
                  <ArrowLeft />
                </button>
                <button
                  type="button"
                  disabled={phaseIndex === lifecyclePhases.length - 1}
                  aria-label="Next lifecycle phase"
                  onClick={() => selectPhase(lifecyclePhases[phaseIndex + 1])}
                >
                  <ArrowRight />
                </button>
              </div>
            </header>

            <div className="guided-content">
              <div className="behavior-picker">
                <p className="guided-step-label">03 / CHOOSE BEHAVIOR</p>
                {phaseRecords.map((record) => {
                  const count = coverage(record);
                  return (
                    <button
                      key={record.id}
                      type="button"
                      aria-pressed={focused.id === record.id}
                      onClick={() => setFocusedId(record.id)}
                    >
                      <span>
                        <code>{record.id}</code>
                        <small>ATT&amp;CK · {record.mappingConfidence}</small>
                      </span>
                      <strong>{record.technique}</strong>
                      <em>{coverageText(record)}</em>
                      {(count.unknown > 0 || count.notApplicable > 0) && (
                        <small>
                          {count.unknown ? `${count.unknown} unknown` : ''}
                          {count.unknown && count.notApplicable ? ' · ' : ''}
                          {count.notApplicable
                            ? `${count.notApplicable} N/A`
                            : ''}
                        </small>
                      )}
                    </button>
                  );
                })}
              </div>

              <article className="guided-analysis" aria-live="polite">
                <header>
                  <code>{focused.id}</code>
                  <h2>{focused.technique}</h2>
                  <span>{coverageText(focused)}</span>
                </header>

                <section className="analysis-primary">
                  <div>
                    <h3>Shared behavior</h3>
                    <p>{focused.invariant}</p>
                  </div>
                  <div>
                    <h3>Kit differences</h3>
                    <div className="procedure-list compact-procedures">
                      {focused.procedures
                        .filter((item) => selectedKits.includes(item.kitId))
                        .map((item) => {
                          const kit = kitProfiles.find(
                            (profile) => profile.id === item.kitId,
                          )!;
                          return (
                            <article key={item.kitId}>
                              <div>
                                <strong>{kit.name}</strong>
                                <span
                                  className={`applicability applicability-${item.applicability}`}
                                >
                                  {stateLabel(item.applicability)}
                                </span>
                              </div>
                              <p>{item.procedure}</p>
                            </article>
                          );
                        })}
                    </div>
                  </div>
                  <div className="defender-payoff">
                    <h3>
                      <ShieldAlert size={16} />
                      Defender payoff
                    </h3>
                    <p>{focused.detectionOpportunity}</p>
                    <div className="telemetry-tags">
                      {focused.telemetry.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                  </div>
                </section>

                {procedureAtomics.map(({ procedure, mapping }) => {
                  const kit = kitProfiles.find(
                    (profile) => profile.id === procedure.kitId,
                  )!;
                  return (
                    <a
                      className="atomic-coverage-link behavior-emulation-link"
                      href={sitePath(`/atomics/${mapping.slug}`)}
                      key={`${mapping.slug}-${procedure.kitId}`}
                    >
                      <span>
                        <FlaskConical size={16} />
                        <strong>Emulate {kit.name} behavior</strong>
                      </span>
                      <em>Lab substitute: {mapping.safeSubstitute}</em>
                    </a>
                  );
                })}

                <div className="analysis-disclosures">
                  <details>
                    <summary>Evidence and interpretation</summary>
                    <dl>
                      <div>
                        <dt>Mapping</dt>
                        <dd>
                          {focused.mappingConfidence}-confidence ATT&amp;CK
                          mapping
                        </dd>
                      </div>
                      <div>
                        <dt>Review state</dt>
                        <dd>{focused.reviewState}</dd>
                      </div>
                      <div>
                        <dt>Implementation variance</dt>
                        <dd>{focused.difference}</dd>
                      </div>
                      <div>
                        <dt>Boundary</dt>
                        <dd>{focused.falsePositiveBoundary}</dd>
                      </div>
                    </dl>
                  </details>
                  <details>
                    <summary>Correlation and emulation</summary>
                    <dl>
                      <div>
                        <dt>Join keys</dt>
                        <dd>{focused.joinKeys}</dd>
                      </div>
                      <div>
                        <dt>Window</dt>
                        <dd>{focused.timeWindow}</dd>
                      </div>
                    </dl>
                    {procedureAtomics.length === 0 && (
                      <p className="coverage-empty">
                        <FlaskConical size={15} />
                        No selected procedure has a promoted atomic mapping.
                      </p>
                    )}
                  </details>
                </div>
              </article>
            </div>
          </section>
        </div>
      ) : (
        <div className="guided-matrix-view">
          <div className="matrix-view-heading">
            <div>
              <p className="guided-step-label">FULL COMPARISON</p>
              <h2>Procedure evidence by kit</h2>
            </div>
            <div className="matrix-legend">
              <span className="applicability applicability-observed">
                observed
              </span>
              <span className="applicability applicability-supported">
                supported
              </span>
              <span className="applicability applicability-unknown">
                unknown
              </span>
              <span className="applicability applicability-not-applicable">
                N/A
              </span>
            </div>
          </div>
          <section
            className="convergence-matrix-wrap"
            aria-label="Selected-kit procedure matrix"
          >
            <table className="convergence-matrix">
              <thead>
                <tr>
                  <th>Technique</th>
                  {selectedProfiles.map((kit) => {
                    const isActive = (hoveredKitId ?? tracedKitId) === kit.id;
                    return (
                      <th
                        className={isActive ? 'kit-column-active' : undefined}
                        key={kit.id}
                        scope="col"
                        style={{ '--kit-color': kit.color } as CSSProperties}
                      >
                        <button
                          className="matrix-kit-heading"
                          type="button"
                          aria-label={`Trace ${kit.name} column`}
                          aria-pressed={tracedKitId === kit.id}
                          onClick={() =>
                            setTracedKitId((current) =>
                              current === kit.id ? null : kit.id,
                            )
                          }
                          onFocus={() => setHoveredKitId(kit.id)}
                          onBlur={() => setHoveredKitId(null)}
                          onMouseEnter={() => setHoveredKitId(kit.id)}
                          onMouseLeave={() => setHoveredKitId(null)}
                        >
                          <span aria-hidden="true">{kit.marker}</span>
                          <strong>{kit.name}</strong>
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <th scope="row">
                      <button
                        type="button"
                        aria-label={`Inspect ${record.id} ${record.technique}`}
                        onClick={() => inspectFromMatrix(record)}
                      >
                        <code>{record.id}</code>
                        <span>{record.technique}</span>
                        <small>{record.phase}</small>
                      </button>
                    </th>
                    {selectedProfiles.map((kit) => {
                      const procedure = record.procedures.find(
                        (item) => item.kitId === kit.id,
                      );
                      const isActive = (hoveredKitId ?? tracedKitId) === kit.id;
                      return (
                        <td
                          className={isActive ? 'kit-column-active' : undefined}
                          key={kit.id}
                          style={{ '--kit-color': kit.color } as CSSProperties}
                          onMouseEnter={() => setHoveredKitId(kit.id)}
                          onMouseLeave={() => setHoveredKitId(null)}
                        >
                          <span className="matrix-cell-kit" aria-hidden="true">
                            {kit.marker}
                          </span>
                          <span
                            className={`applicability applicability-${procedure?.applicability ?? 'unknown'}`}
                          >
                            {stateLabel(procedure?.applicability ?? 'unknown')}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </section>
  );
}
