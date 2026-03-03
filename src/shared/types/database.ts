export interface Video {
  id: string;
  character: string;
  scene: string | null;
  reference: string | null;
  script: string | null;
  video_url: string;
  active: boolean;
  is_sample: boolean;
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
