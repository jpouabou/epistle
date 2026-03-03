# Epistle

A cross-platform React Native app (iOS + Android) for daily video encounters. One video per day—watch it, carry it with you, no replay.

## Requirements

- Node.js >= 22.11.0
- React Native CLI
- Xcode (iOS)
- Android Studio (Android)
- CocoaPods (iOS)
- Supabase project

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `src/config.local.example.ts` to `src/config.local.ts` and add your Supabase credentials:

```bash
cp src/config.local.example.ts src/config.local.ts
```

Edit `src/config.local.ts` with your Supabase URL and anon key.

### 3. Supabase setup

Run the following SQL in your Supabase SQL Editor:

```sql
-- videos
create table videos (
  id uuid primary key default gen_random_uuid(),
  character text not null,
  scene text,
  reference text,
  script text,
  video_url text not null,
  active boolean default true,
  is_sample boolean default false
);

-- user_seen_videos
create table user_seen_videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  video_id uuid references videos(id),
  seen_at timestamptz default now(),
  unique(user_id, video_id)
);

-- profiles
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_delivery_time text,
  onboarding_completed boolean default false
);

-- daily_selections
create table daily_selections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  date text not null,
  video_id uuid references videos(id),
  unique(user_id, date)
);

-- RLS policies (adjust as needed for your auth setup)
alter table videos enable row level security;
alter table user_seen_videos enable row level security;
alter table profiles enable row level security;
alter table daily_selections enable row level security;

create policy "Videos are readable by all" on videos for select using (true);
create policy "Users can manage own seen videos" on user_seen_videos for all using (auth.uid() = user_id);
create policy "Users can manage own profile" on profiles for all using (auth.uid() = user_id);
create policy "Users can manage own daily selections" on daily_selections for all using (auth.uid() = user_id);

-- Optional: Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 4. iOS

```bash
cd ios && pod install && cd ..
```

**Note:** If `pod install` fails with "Unable to locate cmake", install Xcode Command Line Tools and cmake (`brew install cmake`).

### 5. Android

For Notifee notifications, ensure your `AndroidManifest.xml` includes:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```

### 6. Run

```bash
# Start Metro
npm start

# iOS (in another terminal)
npm run ios

# Android
npm run android
```

## Project structure

```
src/
├── config.ts              # Supabase config (reads from .env)
├── shared/
│   ├── providers/          # React context providers
│   ├── services/          # Business logic
│   ├── repositories/      # Supabase & AsyncStorage access
│   ├── types/             # TypeScript types
│   └── utils/             # Constants, Supabase client
├── features/
│   ├── onboarding/        # Character intro + time picker
│   ├── encounter/         # Daily video screen
│   ├── characters/        # Gallery + detail
│   ├── auth/              # Sign in/up
│   └── settings/          # Delivery time, account
└── navigation/            # App navigator
```

## Architecture

- **Screens** → **Providers** → **Services** → **Repositories**
- Repositories perform Supabase/AsyncStorage CRUD
- Unauthenticated users: data stored in AsyncStorage
- Authenticated users: data stored in Supabase

## Features

- **Onboarding**: Swipe through 10 Bible characters, set daily delivery time
- **Daily Encounter**: One video per day, no replay, no history
- **Characters Gallery**: Browse character info (no videos)
- **Auth**: Email/password via Supabase, optional "Continue without account"
- **Notifications**: Local daily notification at chosen time
