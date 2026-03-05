import { useState, useEffect, useCallback } from 'react';
import type { HistoryEncounter } from '../../shared/types/database';
import { getEncounters } from '../../shared/repositories/HistoryRepository';

export function useHistoryEncounters(): {
  encounters: HistoryEncounter[];
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [encounters, setEncounters] = useState<HistoryEncounter[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getEncounters();
      setEncounters(list);
    } catch {
      setEncounters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { encounters, loading, refresh };
}
