import { useEffect, useState } from 'react';
import type { ChecklistResult } from '../../types';
import { ChecklistItem } from '../../ui/ChecklistItem';
import { runSeoChecks } from './checks';
import { getActiveDocument, onActiveDocumentChange } from '../../core/active-document';

export function SeoFeature() {
  const [results, setResults] = useState<ChecklistResult[]>([]);

  useEffect(() => {
    let observer: MutationObserver | null = null;

    const refresh = () => {
      const doc = getActiveDocument();
      setResults(runSeoChecks(doc));

      observer?.disconnect();
      observer = new MutationObserver(refresh);
      observer.observe(doc.head, { childList: true, subtree: true, attributes: true });
      observer.observe(doc.documentElement, { attributes: true, attributeFilter: ['lang'] });
    };

    refresh();
    const unwatch = onActiveDocumentChange(refresh);
    return () => {
      observer?.disconnect();
      unwatch();
    };
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
