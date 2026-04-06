import type {
  Video,
  UserSeenVideo,
  Profile,
  DailySelection,
  EpistleVerseRow,
} from './database';

export interface Database {
  public: {
    Tables: {
      characters: {
        Row: {
          id: string;
          key: string;
          display_name: string;
          description: string | null;
          sort_order: number;
          app_status: 'available' | 'coming_soon';
          is_active: boolean;
          created_at?: string;
        };
        Insert: {
          id?: string;
          key: string;
          display_name: string;
          description?: string | null;
          sort_order?: number;
          app_status?: 'available' | 'coming_soon';
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          key: string;
          display_name: string;
          description: string | null;
          sort_order: number;
          app_status: 'available' | 'coming_soon';
          is_active: boolean;
          created_at?: string;
        }>;
      };
      videos: { Row: Video; Insert: Omit<Video, 'id'>; Update: Partial<Video> };
      epistle_verses: {
        Row: EpistleVerseRow;
        Insert: Omit<EpistleVerseRow, 'id' | 'created_at'>;
        Update: Partial<EpistleVerseRow>;
      };
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
