import { useCallback, useEffect, useMemo, useState } from 'react';

// Multi-selection over the visible ids; it empties whenever `resetKey` changes (e.g. another folder opens).
export const useSelection = (ids: string[], resetKey: string) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => setSelectedIds(new Set()), [resetKey]);

  const allSelected = ids.length > 0 && ids.every((id) => selectedIds.has(id));

  const toggle = useCallback((id: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(
    () => setSelectedIds(allSelected ? new Set() : new Set(ids)),
    [allSelected, ids],
  );

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  return useMemo(
    () => ({ selectedIds, count: selectedIds.size, allSelected, toggle, toggleAll, clear }),
    [selectedIds, allSelected, toggle, toggleAll, clear],
  );
};
