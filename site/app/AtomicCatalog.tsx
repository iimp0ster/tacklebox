'use client';

import {
  CheckCircle2,
  Filter,
  Search,
  TestTube2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { sitePath } from '../lib/site-path';

export type PublicAtomic = {
  slug: string;
  technique: string;
  testName: string;
  description: string;
  phase: string;
  fidelity: 'strong' | 'partial';
  mappedKits: string[];
  executor: string;
  hasCleanup: boolean;
};

type BrowseMode = 'test' | 'tactic' | 'kit';

const modeLabels: { id: BrowseMode; label: string }[] = [
  { id: 'test', label: 'All tests' },
  { id: 'tactic', label: 'By tactic' },
  { id: 'kit', label: 'By AiTM kit' },
];

export default function AtomicCatalog({
  atomics,
}: {
  atomics: PublicAtomic[];
}) {
  const [mode, setMode] = useState<BrowseMode>('test');
  const [group, setGroup] = useState('all');
  const [query, setQuery] = useState('');

  const groupOptions = useMemo(() => {
    if (mode === 'tactic')
      return [...new Set(atomics.map((item) => item.phase))].sort();
    if (mode === 'kit')
      return [...new Set(atomics.flatMap((item) => item.mappedKits))].sort();
    return [];
  }, [atomics, mode]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return atomics.filter((item) => {
      const matchesGroup =
        group === 'all' ||
        (mode === 'tactic' && item.phase === group) ||
        (mode === 'kit' && item.mappedKits.includes(group));
      const haystack =
        `${item.technique} ${item.testName} ${item.description} ${item.phase} ${item.mappedKits.join(' ')}`.toLowerCase();
      return matchesGroup && (!needle || haystack.includes(needle));
    });
  }, [atomics, group, mode, query]);

  function changeMode(next: BrowseMode) {
    setMode(next);
    setGroup('all');
  }

  return (
    <>
      <section
        className="atomic-browser"
        aria-label="Choose how to browse atomic tests"
      >
        <div className="atomic-mode-grid">
          {modeLabels.map((item) => (
            <button
              key={item.id}
              className={mode === item.id ? 'active' : ''}
              onClick={() => changeMode(item.id)}
              aria-pressed={mode === item.id}
            >
              <TestTube2 size={19} />
              <b>{item.label}</b>
            </button>
          ))}
        </div>

        <label className="search-field atomic-search">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search technique, behavior, or kit…"
          />
        </label>

        {mode !== 'test' && (
          <div className="atomic-group-filter">
            <Filter size={16} />
            <button
              className={group === 'all' ? 'active' : ''}
              onClick={() => setGroup('all')}
            >
              All {mode === 'tactic' ? 'tactics' : 'kits'}
            </button>
            {groupOptions.map((option) => (
              <button
                key={option}
                className={group === option ? 'active' : ''}
                onClick={() => setGroup(option)}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="catalog-result-heading">
        <div>
          <span>
            {mode === 'test'
              ? 'INDIVIDUAL TESTS'
              : mode === 'tactic'
                ? 'TACTIC VIEW'
                : 'KIT VIEW'}
          </span>
          <h2>
            {group === 'all'
              ? modeLabels.find((item) => item.id === mode)?.label
              : group}
          </h2>
        </div>
        <b>{filtered.length} tests</b>
      </div>

      <section className="atomic-grid">
        {filtered.map((item, index) => (
          <a
            className="atomic-card atomic-catalog-card"
            href={sitePath(`/atomics/${item.slug}`)}
            key={item.slug}
          >
            <div className="atomic-top">
              <span className="technique">{item.technique}</span>
              <span className={`status status-${item.fidelity}`}>
                {item.fidelity}
              </span>
            </div>
            <h3>{item.testName}</h3>
            <p>{item.description}</p>
            <div className="atomic-meta">
              <span>{item.phase}</span>
              <span>{item.executor || 'manual'}</span>
            </div>
            {item.mappedKits.length > 0 && (
              <div className="kit-tags">
                {item.mappedKits.slice(0, 4).map((kit) => (
                  <span key={kit}>{kit}</span>
                ))}
                {item.mappedKits.length > 4 && (
                  <span>+{item.mappedKits.length - 4}</span>
                )}
              </div>
            )}
            <div className="atomic-card-footer">
              <span
                className={
                  item.hasCleanup ? 'cleanup-ready' : 'cleanup-missing'
                }
              >
                <CheckCircle2 size={14} />{' '}
                {item.hasCleanup ? 'Cleanup defined' : 'Cleanup missing'}
              </span>
            </div>
            <span className="ghost-number">
              {String(index + 1).padStart(2, '0')}
            </span>
          </a>
        ))}
      </section>

      {filtered.length === 0 && (
        <div className="catalog-empty">
          <Search />
          <h2>No atomic tests match this view</h2>
          <p>Clear the search or choose another tactic or kit.</p>
        </div>
      )}
    </>
  );
}
