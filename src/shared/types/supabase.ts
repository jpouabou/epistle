import type { Video, UserSeenVideo, Profile, DailySelection } from './database';

export interface Database {
  public: {
    Tables: {
      videos: { Row: Video; Insert: Omit<Video, 'id'>; Update: Partial<Video> };
      user_seen_videos: {
        Row: UserSeenVideo;
        Insert: Omit<UserSeenVideo, 'id' | 'seen_at'>;
        Update: Partial<UserSeenVideo>;
      };
      profiles: {
        Row: Profile;
        Insert: Profile;
        Update: Partial<Profile>;
      };
      daily_selections: {
        Row: DailySelection;
        Insert: Omit<DailySelection, 'id'>;
        Update: Partial<DailySelection>;
      };
    };
  };
}
