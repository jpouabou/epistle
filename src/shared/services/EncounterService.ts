import { videoRepository } from '../repositories/VideoRepository';
import { seenVideoRepository } from '../repositories/SeenVideoRepository';
import { dailySelectionRepository } from '../repositories/DailySelectionRepository';
import { localStorageRepository } from '../repositories/LocalStorageRepository';
import { authRepository } from '../repositories/AuthRepository';
import type { Video } from '../types/database';

export type EncounterState =
  | { state: 'loading' }
  | { state: 'video'; video: Video }
  | { state: 'seen'; video: Video }
  | { state: 'no_videos' };

function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class EncounterService {
  async getOrSelectTodaysVideo(): Promise<EncounterState> {
    const date = getTodayDate();
    const { user } = await authRepository.getSession();
    const isAnonymous = !user;

    if (isAnonymous) {
      return this.getOrSelectForAnonymous(date);
    }
    return this.getOrSelectForAuthenticated(user.id, date);
  }

  private async getOrSelectForAnonymous(
    date: string
  ): Promise<EncounterState> {
    const selection = await localStorageRepository.getDailySelection(date);
    const seenIds = await localStorageRepository.getSeenVideoIds();

    if (selection) {
      if (seenIds.includes(selection)) {
        const video = await videoRepository.getVideoById(selection);
        if (video) return { state: 'seen', video };
      }
      const video = await videoRepository.getVideoById(selection);
      if (video) return { state: 'video', video };
    }

    const allVideos = await videoRepository.getActiveNonSampleVideos();
    const unseen = allVideos.filter((v) => !seenIds.includes(v.id));

    if (unseen.length === 0) return { state: 'no_videos' };

    const chosen = pickRandom(unseen);
    await localStorageRepository.setDailySelection(date, chosen.id);
    return { state: 'video', video: chosen };
  }

  private async getOrSelectForAuthenticated(
    userId: string,
    date: string
  ): Promise<EncounterState> {
    const selection = await dailySelectionRepository.getSelection(userId, date);
    const seenIds = await seenVideoRepository.getSeenVideoIds(userId);

    if (selection) {
      if (seenIds.includes(selection)) {
        const video = await videoRepository.getVideoById(selection);
        if (video) return { state: 'seen', video };
      }
      const video = await videoRepository.getVideoById(selection);
      if (video) return { state: 'video', video };
    }

    const allVideos = await videoRepository.getActiveNonSampleVideos();
    const unseen = allVideos.filter((v) => !seenIds.includes(v.id));

    if (unseen.length === 0) return { state: 'no_videos' };

    const chosen = pickRandom(unseen);
    await dailySelectionRepository.setSelection(userId, date, chosen.id);
    return { state: 'video', video: chosen };
  }

  async markSeen(videoId: string): Promise<void> {
    const { user } = await authRepository.getSession();

    if (user) {
      await seenVideoRepository.markSeen(user.id, videoId);
    } else {
      await localStorageRepository.addSeenVideoId(videoId);
    }
  }
}

export const encounterService = new EncounterService();
