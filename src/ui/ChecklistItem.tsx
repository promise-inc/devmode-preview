import type { ChecklistResult } from '../types';

interface ChecklistItemProps {
  item: ChecklistResult;
}

export function ChecklistItem({ item }: ChecklistItemProps) {
  return (
    <div className="dmp-check">
      <div className="dmp-check__row">
        <span className="dmp-check__dot" data-status={item.status} aria-hidden />
        <div className="dmp-check__body">
          <p className="dmp-check__label">{item.label}</p>
          {item.value ? <p className="dmp-check__value">{item.value}</p> : null}
          {item.hint ? <p className="dmp-check__hint">{item.hint}</p> : null}
        </div>
      </div>
    </div>
  );
}
