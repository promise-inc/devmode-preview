import { useEffect, useState } from 'react';
import type { ChecklistResult } from '../../types';
import { ChecklistItem } from '../../ui/ChecklistItem';
import { runSeoChecks } from './checks';

export function SeoFeature() {
  const [results, setResults] = useState<ChecklistResult[]>([]);

  useEffect(() => {
    setResults(runSeoChecks());
    const observer = new MutationObserver(() => {
      setResults(runSeoChecks());
    });
    observer.observe(document.head, { childList: true, subtree: true, attributes: true });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    return () => observer.disconnect();
  }, []);

  const passing = results.filter((r) => r.status === 'pass').length;
  const total = results.length;

  return (
    <div className="dmp-panel">
      <p className="dmp-panel__intro">
        Live SEO audit of the current page DOM. Updates automatically as <code>&lt;head&gt;</code>{' '}
        changes. <strong>{passing}/{total}</strong> checks passing.
      </p>
      <div className="dmp-stack">
        {results.map((item) => (
          <ChecklistItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
