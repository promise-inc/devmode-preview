import type { FeatureKey } from '../types';

interface TabItem {
  id: FeatureKey;
  label: string;
  full?: string;
}

interface TabsProps {
  tabs: TabItem[];
  active: FeatureKey;
  onSelect: (id: FeatureKey) => void;
}

export function Tabs({ tabs, active, onSelect }: TabsProps) {
  return (
    <div className="dmp-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          data-active={active === tab.id ? 'true' : 'false'}
          className="dmp-tab"
          onClick={() => onSelect(tab.id)}
          title={tab.full ?? tab.label}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
