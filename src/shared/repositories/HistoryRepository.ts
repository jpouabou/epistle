import type { HistoryEncounter } from '../types/database';

/**
 * Returns visitation history (one per day, most recent first).
 * Replace the implementation with a DB/API call and map rows to HistoryEncounter.
 * DB shape example: { encountered_at, reference, author, verse_id } -> camelCase.
 */
export async function getEncounters(): Promise<HistoryEncounter[]> {
  // TODO: Replace with API call, e.g.:
  // const rows = await api.get('/visitations');
  // return rows.map(mapDbRowToEncounter);
  return getMockEncounters();
}

/** Map a DB row to HistoryEncounter. Use when wiring real API. */
export function mapDbRowToEncounter(row: {
  encountered_at: string | number;
  reference: string;
  author: string;
  verse_id: string;
}): HistoryEncounter {
  const at =
    typeof row.encountered_at === 'string'
      ? new Date(row.encountered_at).getTime()
      : row.encountered_at;
  return {
    encounteredAt: at,
    reference: row.reference,
    author: row.author,
    verseId: row.verse_id,
  };
}

/** MVP mock: one visitation per day. Remove when using real data. */
function getMockEncounters(): HistoryEncounter[] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  return [
    {
      encounteredAt: now - 0,
      reference: 'Romans 8:28–29',
      author: 'Paul',
      verseId: 'mock-1',
    },
    {
      encounteredAt: now - 1 * day,
      reference: 'Psalm 23:1–3',
      author: 'David',
      verseId: 'mock-2',
    },
    {
      encounteredAt: now - 2 * day,
      reference: 'Isaiah 40:31',
      author: 'Isaiah',
      verseId: 'mock-3',
    },
    {
      encounteredAt: now - 3 * day,
      reference: 'John 1:1–5',
      author: 'John',
      verseId: 'mock-4',
    },
    {
      encounteredAt: now - 4 * day,
      reference: 'Jeremiah 29:11',
      author: 'Jeremiah',
      verseId: 'mock-5',
    },
  ];
}
