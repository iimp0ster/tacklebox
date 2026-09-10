'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  FileSearch,
  Network,
  Search,
  TriangleAlert,
} from 'lucide-react';
import {
  infraSamples,
  type AttackTrace,
  InfraNode,
  InfraRelation,
  type InfraSample,
  sneakyInfraNodes,
  sneakyInfraRelations,
  sneakyInfraTraces,
} from '../content/infrastructure';
import LureAnatomy from './SneakyLureAnatomy';
import { sitePath } from '../../lib/site-path';
import PixelNodeIcon from './PixelNodeIcon';
import { getRelationAtomicMappings } from '../content/atomic-mappings';

type Lens = 'flow' | 'anatomy' | 'samples';
type GraphMode = 'trace' | 'topology';

const nodePositions: Record<string, { left: string; top: string }> = {
  delivery: { left: '9%', top: '25%' },
  gate: { left: '30%', top: '14%' },
  relay: { left: '51%', top: '30%' },
  identity: { left: '81%', top: '15%' },
  session: { left: '75%', top: '51%' },
  operator: { left: '47%', top: '72%' },
  postauth: { left: '77%', top: '86%' },
  workloads: { left: '91%', top: '69%' },
};

const sneakySamples = infraSamples.filter(
  (sample) => sample.kit === 'Sneaky 2FA',
);

export type InfrastructureGuideDefinition = {
  kitId: string;
  kitName: string;
  traceLabel: string;
  nodes: InfraNode[];
  relations: InfraRelation[];
  traces: AttackTrace[];
  samples: InfraSample[];
  anatomy: ReactNode;
};

function EvidenceBadge({ node }: { node: InfraNode }) {
  return (
    <span
      className={`infra-evidence evidence-${node.evidence.class} ${node.evidence.class === 'platform-owned' ? 'owned' : ''}`}
    >
      {node.evidence.class} · {node.evidence.confidence}
    </span>
  );
}

function RelationEvidenceBadge({ relation }: { relation: InfraRelation }) {
  return (
    <span className={`relation-evidence evidence-${relation.evidence.class}`}>
      {relation.evidence.class} · {relation.evidence.confidence}
    </span>
  );
}

export function KitInfrastructureMap({
  definition,
}: {
  definition: InfrastructureGuideDefinition;
}) {
  const {
    kitId,
    kitName,
    traceLabel,
    nodes,
    relations,
    traces,
    samples,
    anatomy,
  } = definition;
  const [lens, setLens] = useState<Lens>('flow');
  const [graphMode, setGraphMode] = useState<GraphMode>('trace');
  const [selectedId, setSelectedId] = useState(nodes[0].id);
  const [selectedRelationId, setSelectedRelationId] = useState(relations[0].id);
  const [selectedSampleId, setSelectedSampleId] = useState(samples[0].id);
  const [copied, setCopied] = useState('');
  const selected = nodes.find((node) => node.id === selectedId) ?? nodes[0];
  const selectedRelations = relations.filter(
    (relation) => relation.from === selected.id || relation.to === selected.id,
  );
  const selectedRelation =
    relations.find((relation) => relation.id === selectedRelationId) ??
    relations[0];
  const trace = traces[0];
  const traceRelations = trace.steps
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((step) => relations.find((relation) => relation.id === step.edgeId))
    .filter((relation): relation is InfraRelation => Boolean(relation));
  const modeledRelations = relations.filter(
    (relation) => relation.requirement !== 'required',
  );
  const selectedTraceIndex = traceRelations.findIndex(
    (relation) => relation.id === selectedRelation.id,
  );
  const selectedBranchIndex = modeledRelations.findIndex(
    (relation) => relation.id === selectedRelation.id,
  );
  const isTraceStep = selectedTraceIndex >= 0;
  const selectedFromNode = nodes.find(
    (node) => node.id === selectedRelation.from,
  );
  const selectedToNode = nodes.find((node) => node.id === selectedRelation.to);
  const relationAtomics = getRelationAtomicMappings(selectedRelation.id, kitId);
  const selectedSample =
    samples.find((sample) => sample.id === selectedSampleId) ?? samples[0];
  const copyQuery = async (key: string, query: string) => {
    await navigator.clipboard.writeText(query);
    setCopied(key);
    window.setTimeout(() => setCopied(''), 1800);
  };

  return (
    <>
      <div
        className="map-lenses"
        role="tablist"
        aria-label="Infrastructure map lens"
      >
        <button
          role="tab"
          aria-selected={lens === 'flow'}
          onClick={() => setLens('flow')}
        >
          <Network />
          Attack graph
        </button>
        <button
          role="tab"
          aria-selected={lens === 'anatomy'}
          onClick={() => setLens('anatomy')}
        >
          <FileSearch />
          Lure anatomy
        </button>
        <button
          role="tab"
          aria-selected={lens === 'samples'}
          onClick={() => setLens('samples')}
        >
          <Search />
          Reproduce the hunt
        </button>
      </div>

      {lens === 'flow' && (
        <div className="map-workspace">
          <section
            className="attack-canvas"
            aria-label="AiTM attack knowledge graph"
          >
            <div className="graph-toolbar">
              <div className="map-legend">
                <span>
                  <i className="delivery-dot" />
                  Delivery
                </span>
                <span>
                  <i className="relay-dot" />
                  Attacker controlled
                </span>
                <span>
                  <i className="identity-dot" />
                  Shared identity service
                </span>
                <span>
                  <i className="workload-dot" />
                  Microsoft cloud services
                </span>
                <span>
                  <i className="operator-dot" />
                  Operator activity
                </span>
              </div>
              <fieldset className="graph-mode-toggle">
                <legend>Graph display mode</legend>
                <button
                  aria-pressed={graphMode === 'trace'}
                  onClick={() => setGraphMode('trace')}
                >
                  {traceLabel}
                </button>
                <button
                  aria-pressed={graphMode === 'topology'}
                  onClick={() => setGraphMode('topology')}
                >
                  Topology
                </button>
              </fieldset>
              <span className="graph-pan-hint">
                Swipe graph to follow the chain →
              </span>
            </div>
            {graphMode === 'trace' && (
              <>
                <div className="trace-heading">
                  <div>
                    <span>SUPPORTED SEQUENCE</span>
                    <b>{trace.label}</b>
                  </div>
                  <small>{trace.subjectScope}</small>
                </div>
                <nav
                  className="edge-stepper"
                  aria-label={`${kitName} trace steps`}
                >
                  {traceRelations.map((relation, index) => (
                    <button
                      key={relation.id}
                      aria-current={
                        relation.id === selectedRelation.id ? 'step' : undefined
                      }
                      onClick={() => setSelectedRelationId(relation.id)}
                    >
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <b>{relation.label}</b>
                    </button>
                  ))}
                </nav>
                <div className="modeled-branches">
                  <span>OPTIONAL MODELED BRANCHES</span>
                  <nav aria-label="Optional modeled branches">
                    {modeledRelations.map((relation, index) => (
                      <button
                        key={relation.id}
                        aria-current={
                          relation.id === selectedRelation.id
                            ? 'step'
                            : undefined
                        }
                        onClick={() => setSelectedRelationId(relation.id)}
                      >
                        <span>{String.fromCharCode(65 + index)}</span>
                        <b>{relation.label}</b>
                        <small>{relation.evidence.class}</small>
                      </button>
                    ))}
                  </nav>
                </div>
                <div className="edge-flow-summary" aria-live="polite">
                  <span>
                    {isTraceStep
                      ? `Trace step ${String(selectedTraceIndex + 1).padStart(2, '0')}`
                      : `Modeled branch ${String.fromCharCode(65 + selectedBranchIndex)}`}
                  </span>
                  <div>
                    <b>{selectedFromNode?.title}</b>
                    <em>
                      <ArrowRight aria-hidden="true" />
                      {selectedRelation.label}
                      <ArrowRight aria-hidden="true" />
                    </em>
                    <b>{selectedToNode?.title}</b>
                  </div>
                  <small>
                    Data / event class: {selectedRelation.data.eventClass}
                  </small>
                </div>
              </>
            )}
            <section
              className={`knowledge-graph ${graphMode === 'trace' ? 'data-mode' : ''}`}
              aria-label={`${nodes.length} entities connected by ${traceRelations.length} supported trace steps and ${modeledRelations.length} optional modeled relationships`}
            >
              <div className="graph-zone zone-web">
                <span>ATTACKER WEB</span>
              </div>
              <div className="graph-zone zone-trust">
                <span>TRUST BOUNDARY</span>
              </div>
              <div className="graph-zone zone-cloud">
                <span>CLOUD CONTROL</span>
              </div>
              <svg
                className="graph-edges"
                viewBox="0 0 1000 620"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <marker
                    id="kg-arrow"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" />
                  </marker>
                </defs>
                {relations.map((relation) => {
                  const active =
                    graphMode === 'trace'
                      ? relation.id === selectedRelationId
                      : relation.from === selectedId ||
                        relation.to === selectedId;
                  return (
                    <g
                      key={relation.id}
                      className={`kg-relation relation-${relation.kind} ${relation.requirement !== 'required' ? 'optional' : ''} ${active ? 'active' : ''}`}
                    >
                      <path d={relation.path} markerEnd="url(#kg-arrow)" />
                      <text x={relation.labelX} y={relation.labelY}>
                        {relation.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
              {graphMode === 'trace' &&
                relations.map((relation) => {
                  const traceIndex = traceRelations.findIndex(
                    (item) => item.id === relation.id,
                  );
                  const branchIndex = modeledRelations.findIndex(
                    (item) => item.id === relation.id,
                  );
                  return (
                    <button
                      key={relation.id}
                      className={`kg-data-packet ${relation.requirement !== 'required' ? 'optional' : ''} ${selectedRelationId === relation.id ? 'selected' : ''}`}
                      style={{
                        left: `${relation.labelX / 10}%`,
                        top: `${relation.labelY / 6.2}%`,
                      }}
                      aria-pressed={selectedRelationId === relation.id}
                      aria-label={`${relation.data.eventClass}: ${relation.data.direction}`}
                      onClick={() => setSelectedRelationId(relation.id)}
                    >
                      <span>
                        {traceIndex >= 0
                          ? String(traceIndex + 1).padStart(2, '0')
                          : String.fromCharCode(65 + branchIndex)}
                      </span>
                    </button>
                  );
                })}
              {nodes.map((node) => {
                const sampleCount = samples.filter((sample) =>
                  sample.nodeIds.includes(node.id),
                ).length;
                return (
                  <button
                    style={nodePositions[node.id]}
                    className={`kg-node plane-${node.plane} ${selectedId === node.id ? 'selected' : ''} ${graphMode === 'trace' && (selectedRelation.from === node.id || selectedRelation.to === node.id) ? 'edge-focus' : ''}`}
                    key={node.id}
                    onClick={() => {
                      setSelectedId(node.id);
                      const firstRelation = relations.find(
                        (relation) =>
                          relation.from === node.id || relation.to === node.id,
                      );
                      if (graphMode === 'trace' && firstRelation)
                        setSelectedRelationId(firstRelation.id);
                    }}
                    aria-pressed={selectedId === node.id}
                    aria-label={`${node.step}: ${node.title}`}
                  >
                    <span>{node.step}</span>
                    {sampleCount > 0 && (
                      <em title={`${sampleCount} connected samples`}>
                        {sampleCount}
                      </em>
                    )}
                    <PixelNodeIcon role={node.id} />
                    <b>{node.title}</b>
                    <small>{node.role}</small>
                  </button>
                );
              })}
              <div className="graph-key">
                <span>{nodes.length} entities</span>
                <i />
                <span>
                  {graphMode === 'trace'
                    ? `${traceRelations.length} trace steps + ${modeledRelations.length} optional branches`
                    : `${relations.length} typed relations`}
                </span>
              </div>
            </section>
          </section>

          {graphMode === 'trace' ? (
            <aside className="node-inspector data-inspector" aria-live="polite">
              <div className="inspector-top">
                <span>
                  {isTraceStep
                    ? `TRACE STEP ${String(selectedTraceIndex + 1).padStart(2, '0')} OF ${String(traceRelations.length).padStart(2, '0')} // ${kitName.toUpperCase()}`
                    : `MODELED BRANCH ${String.fromCharCode(65 + selectedBranchIndex)} // OPTIONAL`}
                </span>
                <RelationEvidenceBadge relation={selectedRelation} />
              </div>
              <h2>{selectedRelation.data.eventClass}</h2>
              <p>{selectedRelation.data.direction}</p>
              <h3>Data / event class</h3>
              <div className="relation-payloads">
                {selectedRelation.data.values.map((value) => (
                  <code key={value}>{value}</code>
                ))}
              </div>
              <dl className="relation-meta">
                <div className="visibility-priority">
                  <dt>Where defenders see it</dt>
                  <dd>{selectedRelation.data.visibility}</dd>
                </div>
                <div>
                  <dt>Correlation join</dt>
                  <dd>{selectedRelation.data.correlation}</dd>
                </div>
                <div>
                  <dt>Relationship status</dt>
                  <dd>
                    {selectedRelation.requirement} ·{' '}
                    {selectedRelation.temporalRelationship}
                  </dd>
                </div>
                <div>
                  <dt>Evidence scope</dt>
                  <dd>
                    {selectedRelation.evidence.scope} ·{' '}
                    {selectedRelation.evidence.validation}
                  </dd>
                </div>
                <div>
                  <dt>Join keys</dt>
                  <dd>{selectedRelation.data.joinKeys.join(' · ')}</dd>
                </div>
                <div>
                  <dt>Evidence source</dt>
                  <dd>{selectedRelation.data.source}</dd>
                </div>
              </dl>
              <div className="relation-node-actions">
                <button
                  onClick={() => {
                    setSelectedId(selectedRelation.from);
                    setGraphMode('topology');
                  }}
                >
                  Inspect source node
                  <span>
                    {
                      nodes.find((node) => node.id === selectedRelation.from)
                        ?.title
                    }
                  </span>
                </button>
                <ArrowRight aria-hidden="true" />
                <button
                  onClick={() => {
                    setSelectedId(selectedRelation.to);
                    setGraphMode('topology');
                  }}
                >
                  Inspect destination
                  <span>
                    {
                      nodes.find((node) => node.id === selectedRelation.to)
                        ?.title
                    }
                  </span>
                </button>
              </div>
              {relationAtomics.map((mapping) => (
                <a
                  className="button-secondary"
                  href={sitePath(`/atomics/${mapping.slug}`)}
                  key={mapping.slug}
                >
                  Test this behavior
                  <span>Lab substitute: {mapping.safeSubstitute}</span>
                  <ArrowRight size={16} />
                </a>
              ))}
              <div className="map-caveat">
                <TriangleAlert />
                <p>{selectedRelation.data.boundary}</p>
              </div>
            </aside>
          ) : (
            <aside className="node-inspector" aria-live="polite">
              <div className="inspector-top">
                <span>
                  {selected.step}
                  {' // '}
                  {selected.role}
                </span>
                <EvidenceBadge node={selected} />
              </div>
              <h2>{selected.title}</h2>
              <p>{selected.summary}</p>
              <dl>
                <div>
                  <dt>Defender vantage</dt>
                  <dd>{selected.vantage}</dd>
                </div>
                <div>
                  <dt>Evidence scope</dt>
                  <dd>
                    {selected.evidence.scope} · {selected.evidence.validation}
                  </dd>
                </div>
              </dl>
              <h3>Telemetry</h3>
              <ul>
                {selected.telemetry.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <h3>Research markers</h3>
              <div className="marker-list">
                {selected.markers.map((marker) => (
                  <span key={marker}>{marker}</span>
                ))}
              </div>
              <h3>Connected relations</h3>
              <div className="relation-list">
                {selectedRelations.map((relation) => {
                  const adjacentId =
                    relation.from === selected.id ? relation.to : relation.from;
                  const adjacent = nodes.find((node) => node.id === adjacentId);
                  return (
                    <button
                      key={relation.id}
                      onClick={() => setSelectedId(adjacentId)}
                    >
                      <span>
                        {relation.from === selected.id ? 'OUT' : 'IN'}
                      </span>
                      <b>{relation.label}</b>
                      <small>{adjacent?.title ?? adjacentId}</small>
                    </button>
                  );
                })}
              </div>
              {samples.some((sample) =>
                sample.nodeIds.includes(selected.id),
              ) && (
                <button
                  className="sample-jump"
                  onClick={() => {
                    const first = samples.find((sample) =>
                      sample.nodeIds.includes(selected.id),
                    );
                    if (first) setSelectedSampleId(first.id);
                    setLens('samples');
                  }}
                >
                  <Search size={15} />
                  Open connected sample evidence
                  <ArrowRight size={15} />
                </button>
              )}
              <div className="map-caveat">
                <TriangleAlert />
                <p>{selected.caveat}</p>
              </div>
            </aside>
          )}
        </div>
      )}

      {lens === 'anatomy' && anatomy}

      {lens === 'samples' && (
        <section className="sample-lens">
          <header className="sample-header">
            <div>
              <p className="section-number">PUBLIC, SOURCE-BACKED RECORDS</p>
              <h2>Reproduce the hunt</h2>
            </div>
            <div>
              <strong>{samples.length}</strong>
              <span>
                {kitName} evidence record{samples.length === 1 ? '' : 's'}
              </span>
            </div>
          </header>
          <div className="sample-workspace">
            <nav className="sample-index" aria-label="Evidence samples">
              {samples.map((sample) => (
                <button
                  key={sample.id}
                  className={sample.id === selectedSample.id ? 'active' : ''}
                  onClick={() => setSelectedSampleId(sample.id)}
                >
                  <span>{sample.kit}</span>
                  <b>{sample.title}</b>
                  <small>{sample.sampleType}</small>
                </button>
              ))}
            </nav>
            <article className="sample-record">
              <div className="sample-record-head">
                <div>
                  <span>
                    {selectedSample.kit}
                    {' // '}
                    {selectedSample.sampleType}
                  </span>
                  <h2>{selectedSample.title}</h2>
                  <p>{selectedSample.observed}</p>
                </div>
                <span className="status status-strong">
                  {selectedSample.confidence} confidence
                </span>
              </div>
              <a
                className="sample-source"
                href={selectedSample.source.url}
                target="_blank"
                rel="noreferrer"
              >
                <span>
                  <b>Evidence source</b>
                  {selectedSample.source.label}
                </span>
                <ExternalLink size={16} />
              </a>
              <section>
                <h3>Observed artifacts</h3>
                <div className="artifact-table">
                  {selectedSample.artifacts.map((artifact) => (
                    <div key={`${artifact.type}-${artifact.value}`}>
                      <span>{artifact.type}</span>
                      <code>{artifact.value}</code>
                      <p>{artifact.meaning}</p>
                      <b className={`stability-${artifact.stability}`}>
                        {artifact.stability}
                      </b>
                    </div>
                  ))}
                </div>
              </section>
              <section>
                <h3>Run the lookup yourself</h3>
                <div className="query-list">
                  {selectedSample.queries.map((query) => {
                    const key = `${selectedSample.id}-${query.provider}`;
                    return (
                      <article key={key}>
                        <div>
                          <b>{query.provider}</b>
                          <span>PASSIVE / EXISTING DATA</span>
                        </div>
                        <code>{query.query}</code>
                        <p>{query.note}</p>
                        <div>
                          <button onClick={() => copyQuery(key, query.query)}>
                            {copied === key ? (
                              <Check size={14} />
                            ) : (
                              <Copy size={14} />
                            )}{' '}
                            {copied === key ? 'Copied' : 'Copy query'}
                          </button>
                          <a href={query.url} target="_blank" rel="noreferrer">
                            Open provider <ExternalLink size={13} />
                          </a>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
              <section className="decision-grid">
                <div>
                  <span>CHOKEPOINT</span>
                  <p>{selectedSample.chokepoint}</p>
                </div>
                <div className="block-decision">
                  <span>BLOCK / CONTAIN</span>
                  <p>{selectedSample.blockGuidance}</p>
                </div>
                <div className="fp-boundary">
                  <span>FALSE-POSITIVE BOUNDARY</span>
                  <p>{selectedSample.falsePositiveBoundary}</p>
                </div>
              </section>
            </article>
          </div>
        </section>
      )}
    </>
  );
}

export default function SneakyInfrastructureMap() {
  return (
    <KitInfrastructureMap
      definition={{
        kitId: 'sneaky',
        kitName: 'Sneaky 2FA',
        traceLabel: 'Sneaky trace',
        nodes: sneakyInfraNodes,
        relations: sneakyInfraRelations,
        traces: sneakyInfraTraces,
        samples: sneakySamples,
        anatomy: <LureAnatomy />,
      }}
    />
  );
}
