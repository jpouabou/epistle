export const BIBLE_CHARACTERS = [
  {
    id: 'paul',
    name: 'Paul',
    description: 'Apostle to the Gentiles, author of many epistles.',
    image: require('../../../assets/Paul.png'),
  },
  {
    id: 'peter',
    name: 'Peter',
    description: 'Leader of the apostles, holder of the key to the Kingdom.',
    image: require('../../../assets/Peter.png'),
  },
  {
    id: 'john',
    name: 'John',
    description: 'Beloved disciple, author of the Gospel and Revelation.',
    image: require('../../../assets/John.png'),
  },
  {
    id: 'jeremiah',
    name: 'Jeremiah',
    description: 'Weeping prophet who foretold the fall of Jerusalem.',
    image: require('../../../assets/Jeremiah.png'),
  },
  {
    id: 'moses',
    name: 'Moses',
    description: 'Deliverer of Israel, receiver of the Law.',
    image: require('../../../assets/Moses.png'),
  },
  {
    id: 'david',
    name: 'David',
    description: "Shepherd king,Warrior, man after God's own heart.",
    image: require('../../../assets/David.png'),
  },
  {
    id: 'solomon',
    name: 'Solomon',
    description: 'Wisest king, builder of the Temple.',
    image: require('../../../assets/Solomon.png'),
  },
  {
    id: 'isaiah',
    name: 'Isaiah',
    description: 'Prophet of comfort and the coming Messiah.',
    image: require('../../../assets/Isaiah.png'),
  },
  {
    id: 'daniel',
    name: 'Daniel',
    description: 'Faithful in exile, interpreter of dreams.',
    image: require('../../../assets/Daniel.png'),
  },
  {
    id: 'jesus',
    name: 'The Son of God',
    description: 'The Christ, The Messiah, Savior of the world.',
    image: require('../../../assets/Jesus.png'),
  },
] as const;

/** Paul sample video URL for onboarding teaser. Replace with real URL from Supabase. */
export const SAMPLE_VIDEO_URL =
  'https://xvnetxcppdpvhhtkxjuv.supabase.co/storage/v1/object/public/videos/samples/Paul%20Ro%208_28_1080p.mp4';

/**
 * RevenueCat API keys. Loaded from env via react-native-config when the native
 * module is available; otherwise fallbacks are used (rebuild app after adding
 * react-native-config so env is used).
 */
let _rcApple = 'appl_YOUR_APPLE_API_KEY';
let _rcGoogle = 'goog_YOUR_GOOGLE_API_KEY';
let _rcEntitlement = 'Epistle Pro';
let _rcFromEnv = false;
try {
  const Config = require('react-native-config').default;
  if (Config) {
    _rcApple = Config.REVENUECAT_API_KEY_APPLE || _rcApple;
    _rcGoogle = Config.REVENUECAT_API_KEY_GOOGLE || _rcGoogle;
    _rcEntitlement = Config.REVENUECAT_ENTITLEMENT_ID || _rcEntitlement;
    _rcFromEnv = true;
  }
} catch {
  // Native RNCConfigModule not linked or not built — use fallbacks until app is rebuilt
}
// #region agent log
fetch('http://127.0.0.1:7898/ingest/c49cc5b1-b626-4b90-918c-76d2c4a06c91', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '645b57' },
  body: JSON.stringify({
    sessionId: '645b57',
    runId: 'investigate',
    hypothesisId: 'constants',
    location: 'constants.ts:env-load',
    message: 'RevenueCat key source',
    data: { fromEnv: _rcFromEnv },
    timestamp: Date.now(),
  }),
}).catch(() => {});
// #endregion
export const REVENUECAT_API_KEY_APPLE = _rcApple;
export const REVENUECAT_API_KEY_GOOGLE = _rcGoogle;
export const REVENUECAT_ENTITLEMENT_ID = _rcEntitlement;

export const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_STEP: 'onboarding_step',
  SUBSCRIPTION_ACTIVE: 'subscription_active',
  DAILY_DELIVERY_TIME: 'daily_delivery_time',
  ANONYMOUS_MODE: 'anonymous_mode',
  SEEN_VIDEOS: 'seen_videos',
  DAILY_SELECTION_PREFIX: 'daily_selection_',
} as const;
