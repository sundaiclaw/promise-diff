import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { samplePromise, sampleShipped } from './sampleData';

function App() {
  const [promisedText, setPromisedText] = useState(samplePromise);
  const [shippedText, setShippedText] = useState(sampleShipped);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState(null);

  const stats = useMemo(() => {
    if (!analysis) return null;
    return [
      { label: 'Matches', value: analysis.matches.length },
      { label: 'Misses', value: analysis.misses.length },
      { label: 'Overclaims', value: analysis.overclaims.length },
      { label: 'Risks', value: analysis.risks.length },
    ];
  }, [analysis]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promisedText, shippedText }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Comparison failed.');
      setAnalysis(payload.result);
    } catch (err) {
      setError(err.message || 'Unexpected error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <span className="eyebrow">AI trust check for launch copy</span>
          <h1>Promise Diff</h1>
          <p>
            Compare what you promised with what actually shipped. Surface matches, misses,
            overclaims, and risky wording — then draft the honest update before the internet does it for you.
          </p>
        </div>
        <div className="hero-card">
          <div>
            <strong>Spot the gap</strong>
            <span>Find promise-to-reality drift before customers do.</span>
          </div>
          <div>
            <strong>Send the honest update</strong>
            <span>Get a calm markdown draft that says what shipped, what didn’t, and what’s next.</span>
          </div>
        </div>
      </header>

      <main className="content-grid">
        <section className="panel">
          <div className="section-head">
            <h2>Input</h2>
            <button type="button" className="ghost" onClick={() => {
              setPromisedText(samplePromise);
              setShippedText(sampleShipped);
            }}>
              Load sample
            </button>
          </div>

          <form onSubmit={handleSubmit} className="compare-form">
            <label>
              <span>Promised / announced</span>
              <textarea
                rows={11}
                value={promisedText}
                onChange={(event) => setPromisedText(event.target.value)}
                placeholder="Paste launch copy, roadmap promise, announcement post, or keynote claims…"
              />
            </label>

            <label>
              <span>Shipped / reality</span>
              <textarea
                rows={11}
                value={shippedText}
                onChange={(event) => setShippedText(event.target.value)}
                placeholder="Paste release notes, current scope, or the real shipped state…"
              />
            </label>

            <div className="form-actions">
              <button type="submit" disabled={loading}>{loading ? 'Comparing…' : 'Compare'}</button>
              <small>Uses a real OpenRouter free model from env.</small>
            </div>
          </form>

          {error ? <div className="error-box">{error}</div> : null}
        </section>

        <section className="panel results-panel">
          <div className="section-head">
            <h2>Reality check</h2>
            {analysis ? <span className="verdict-pill">{analysis.verdict}</span> : null}
          </div>

          {!analysis ? (
            <div className="empty-state">Run a comparison to see where the promise and shipped scope diverge.</div>
          ) : (
            <div className="results-stack">
              <article className="summary-card">
                <h3>Summary</h3>
                <p>{analysis.summary}</p>
                <p className="next-step"><strong>Recommended next step:</strong> {analysis.recommendedNextStep}</p>
              </article>

              {stats ? (
                <div className="stats-grid">
                  {stats.map((stat) => (
                    <div key={stat.label} className="stat-card">
                      <strong>{stat.value}</strong>
                      <span>{stat.label}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="cards-grid">
                <ResultList
                  title="Matches"
                  items={analysis.matches}
                  render={(item) => (
                    <>
                      <strong>{item.claim}</strong>
                      <p>{item.whyItMatches}</p>
                      <small><b>Promise:</b> {item.promiseEvidence}</small>
                      <small><b>Shipped:</b> {item.shippedEvidence}</small>
                    </>
                  )}
                />
                <ResultList
                  title="Misses"
                  items={analysis.misses}
                  render={(item) => (
                    <>
                      <strong>{item.claim}</strong>
                      <p>{item.gap}</p>
                      <small><b>Promise:</b> {item.promiseEvidence}</small>
                      <small><b>Reality:</b> {item.shippedEvidence}</small>
                      <small><b>Impact:</b> {item.impact}</small>
                    </>
                  )}
                />
                <ResultList
                  title="Overclaims"
                  items={analysis.overclaims}
                  render={(item) => (
                    <>
                      <strong>{item.claim}</strong>
                      <p>{item.whyRisky}</p>
                      <small><b>Promise:</b> {item.promiseEvidence}</small>
                      <small><b>Reality:</b> {item.shippedEvidence}</small>
                      <small><b>Impact:</b> {item.impact}</small>
                    </>
                  )}
                />
                <ResultList
                  title="Risks"
                  items={analysis.risks}
                  render={(item) => (
                    <>
                      <strong>{item.text}</strong>
                      <p>{item.reason}</p>
                      <small><b>Impact:</b> {item.impact}</small>
                    </>
                  )}
                />
              </div>

              <article className="panel markdown-panel">
                <div className="section-head">
                  <h3>Honest update draft</h3>
                  <button type="button" className="ghost" onClick={() => navigator.clipboard.writeText(analysis.honestUpdateMarkdown)}>
                    Copy draft
                  </button>
                </div>
                <div className="markdown-body">
                  <ReactMarkdown>{analysis.honestUpdateMarkdown}</ReactMarkdown>
                </div>
              </article>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function ResultList({ title, items, render }) {
  return (
    <article className="panel mini-panel">
      <h3>{title}</h3>
      {items?.length ? (
        <ul className="result-list">
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>{render(item)}</li>
          ))}
        </ul>
      ) : (
        <p className="empty-copy">Nothing notable surfaced here.</p>
      )}
    </article>
  );
}

export default App;
