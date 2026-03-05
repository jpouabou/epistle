import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { Video } from '../types/database';
import type { EncounterState } from '../services/EncounterService';
import { encounterService } from '../services/EncounterService';

interface EncounterContextValue {
  state: EncounterState;
  loading: boolean;
  refresh: () => Promise<void>;
  markSeen: (videoId: string, video: Video) => Promise<void>;
}

const EncounterContext = createContext<EncounterContextValue | null>(null);

export function EncounterProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<EncounterState>({ state: 'loading' });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await encounterService.getOrSelectTodaysVideo();
      setState(result);
    } catch {
      setState({ state: 'no_videos' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const markSeen = useCallback(async (videoId: string, video: Video) => {
    await encounterService.markSeen(videoId);
    setState({ state: 'seen', video });
  }, []);

  return (
    <EncounterContext.Provider
      value={{
        state,
        loading,
        refresh,
        markSeen,
      }}
    >
      {children}
    </EncounterContext.Provider>
  );
}

export function useEncounter() {
  const ctx = useContext(EncounterContext);
  if (!ctx) throw new Error('useEncounter must be used within EncounterProvider');
  return ctx;
}
