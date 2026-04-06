export interface Video {
  id: string;
  character: string;
  scene: string | null;
  reference: string | null;
  script: string | null;
  kjv_text?: string | null;
  closing_text?: string | null;
  video_url: string;
  active: boolean;
  is_sample: boolean;
}

export interface EpistleVerseRow {
  id: string;
  reference: string;
  author: string;
  tags: string[];
  kjv_text: string;
  first_person_version: string;
  closing_text: string | null;
  character_id: string | null;
  character_avatar_id: string | null;
  heygen_video_path: string | null;
  created_at: string;
}

export interface UserSeenVideo {
  id: string;
  user_id: string;
  video_id: string;
  seen_at: string;
}

export interface Profile {
  user_id: string;
  daily_delivery_time: string | null;
  onboarding_completed: boolean;
}

export interface DailySelection {
  id: string;
  user_id: string;
  date: string;
  video_id: string;
}

export interface LocalDailySelection {
  date: string;
  video_id: string;
}

/**
 * A single visitation record for the history list.
 * Map from DB row: encountered_at -> encounteredAt, verse_id -> verseId.
 */
export interface HistoryEncounter {
  encounteredAt: number;
  reference: string;
  author: string;
  verseId: string;
}
