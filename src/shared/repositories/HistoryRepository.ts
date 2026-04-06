import { authRepository } from './AuthRepository';
import { dailySelectionRepository } from './DailySelectionRepository';
import { localStorageRepository } from './LocalStorageRepository';
import { seenVideoRepository } from './SeenVideoRepository';
import { videoRepository } from './VideoRepository';
import type { HistoryEncounter } from '../types/database';

function toEncounteredAt(date: string): number {
  return new Date(`${date}T12:00:00`).getTime();
}

export async function getEncounters(): Promise<HistoryEncounter[]> {
  const { user } = await authRepository.getSession();

  if (user) {
    const [selections, seenIds] = await Promise.all([
      dailySelectionRepository.listSelections(user.id),
      seenVideoRepository.getSeenVideoIds(user.id),
    ]);

    return mapSelectionsToEncounters(selections, seenIds);
  }

  const [selections, seenIds] = await Promise.all([
    localStorageRepository.getAllDailySelections(),
    localStorageRepository.getSeenVideoIds(),
  ]);

  return mapSelectionsToEncounters(selections, seenIds);
}

async function mapSelectionsToEncounters(
  selections: Array<{ date: string; video_id: string }>,
  seenIds: string[],
): Promise<HistoryEncounter[]> {
  const seenSet = new Set(seenIds);
  const deliveredSelections = selections.filter((selection) =>
    seenSet.has(selection.video_id)
  );

  if (deliveredSelections.length === 0) return [];

  const uniqueIds = Array.from(
    new Set(deliveredSelections.map((selection) => selection.video_id))
  );
  const videosById = await videoRepository.getVideosByIds(uniqueIds);

  return deliveredSelections
    .map((selection) => {
      const video = videosById.get(selection.video_id);
      if (!video?.reference) return null;

      return {
        encounteredAt: toEncounteredAt(selection.date),
        reference: video.reference,
        author: video.character,
        verseId: video.id,
      } satisfies HistoryEncounter;
    })
    .filter((entry): entry is HistoryEncounter => entry !== null)
    .sort((a, b) => b.encounteredAt - a.encounteredAt);
}
