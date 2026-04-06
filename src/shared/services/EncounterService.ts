import { videoRepository } from '../repositories/VideoRepository';
import { seenVideoRepository } from '../repositories/SeenVideoRepository';
import { dailySelectionRepository } from '../repositories/DailySelectionRepository';
import { localStorageRepository } from '../repositories/LocalStorageRepository';
import { authRepository } from '../repositories/AuthRepository';
import { onboardingService } from './OnboardingService';
import type { Video } from '../types/database';

export type EncounterState =
  | { state: 'loading' }
  | { state: 'video'; video: Video; isFirstEncounter: boolean; unlockTime: string | null }
  | { state: 'seen'; video: Video; unlockTime: string | null }
  | { state: 'no_videos' };

function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class EncounterService {
  private isImplicitFirstEncounter(
    firstEncounterPending: boolean,
    seenIds: string[],
  ): boolean {
    return firstEncounterPending || seenIds.length === 0;
  }

  async getOrSelectTodaysVideo(): Promise<EncounterState> {
    const date = getTodayDate();
    const { user } = await authRepository.getSession();
    const isAnonymous = !user;
    const firstEncounterPending =
      await localStorageRepository.getFirstEncounterPending();
    const currentDeliveryTime = await onboardingService.getDailyDeliveryTime();

    if (isAnonymous) {
      return this.getOrSelectForAnonymous(
        date,
        firstEncounterPending,
        currentDeliveryTime,
      );
    }
    return this.getOrSelectForAuthenticated(
      user.id,
      date,
      firstEncounterPending,
      currentDeliveryTime,
    );
  }

  private async getOrSelectForAnonymous(
    date: string,
    firstEncounterPending: boolean,
    currentDeliveryTime: string | null,
  ): Promise<EncounterState> {
    const selection = await localStorageRepository.getDailySelection(date);
    const unlockTime = await localStorageRepository.getDailyUnlockTime(date);
    const seenIds = await localStorageRepository.getSeenVideoIds();

    if (selection) {
      if (seenIds.includes(selection)) {
        const video = await videoRepository.getVideoById(selection);
        if (video) return { state: 'seen', video, unlockTime };
      }
      const video = await videoRepository.getVideoById(selection);
      if (video) {
        const isFirstEncounter = this.isImplicitFirstEncounter(
          firstEncounterPending,
          seenIds,
        );
        if (firstEncounterPending) {
          await localStorageRepository.setFirstEncounterPending(false);
        }
        return { state: 'video', video, isFirstEncounter, unlockTime };
      }
    }

    const allVideos = await videoRepository.getActiveNonSampleVideos();
    const unseen = allVideos.filter((v) => !seenIds.includes(v.id));

    if (unseen.length === 0) return { state: 'no_videos' };

    const chosen = pickRandom(unseen);
    const isFirstEncounter = this.isImplicitFirstEncounter(
      firstEncounterPending,
      seenIds,
    );
    const snapshotUnlockTime = currentDeliveryTime;
    if (firstEncounterPending) {
      await localStorageRepository.setFirstEncounterPending(false);
    }
    await localStorageRepository.setDailySelection(date, chosen.id);
    await localStorageRepository.setDailyUnlockTime(date, snapshotUnlockTime);
    return {
      state: 'video',
      video: chosen,
      isFirstEncounter,
      unlockTime: snapshotUnlockTime,
    };
  }

  private async getOrSelectForAuthenticated(
    userId: string,
    date: string,
    firstEncounterPending: boolean,
    currentDeliveryTime: string | null,
  ): Promise<EncounterState> {
    const selection = await dailySelectionRepository.getSelection(userId, date);
    const seenIds = await seenVideoRepository.getSeenVideoIds(userId);

    if (selection) {
      const unlockTime = selection.unlock_time ?? currentDeliveryTime;
      if (!selection.unlock_time && unlockTime) {
        await dailySelectionRepository.setUnlockTime(userId, date, unlockTime);
      }
      if (seenIds.includes(selection.video_id)) {
        const video = await videoRepository.getVideoById(selection.video_id);
        if (video) return { state: 'seen', video, unlockTime };
      }
      const video = await videoRepository.getVideoById(selection.video_id);
      if (video) {
        const isFirstEncounter = this.isImplicitFirstEncounter(
          firstEncounterPending,
          seenIds,
        );
        if (firstEncounterPending) {
          await localStorageRepository.setFirstEncounterPending(false);
        }
        return { state: 'video', video, isFirstEncounter, unlockTime };
      }
    }

    const allVideos = await videoRepository.getActiveNonSampleVideos();
    const unseen = allVideos.filter((v) => !seenIds.includes(v.id));

    if (unseen.length === 0) return { state: 'no_videos' };

    const chosen = pickRandom(unseen);
    const isFirstEncounter = this.isImplicitFirstEncounter(
      firstEncounterPending,
      seenIds,
    );
    const snapshotUnlockTime = currentDeliveryTime;
    if (firstEncounterPending) {
      await localStorageRepository.setFirstEncounterPending(false);
    }
    await dailySelectionRepository.setSelection(
      userId,
      date,
      chosen.id,
      snapshotUnlockTime,
    );
    return {
      state: 'video',
      video: chosen,
      isFirstEncounter,
      unlockTime: snapshotUnlockTime,
    };
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
