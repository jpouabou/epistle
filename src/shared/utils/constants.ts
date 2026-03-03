export const BIBLE_CHARACTERS = [
  { id: 'paul', name: 'Paul', description: 'Apostle to the Gentiles, author of many epistles.', image: require('../../../assets/Paul.png') },
  { id: 'peter', name: 'Peter', description: 'Leader of the apostles, the rock upon which the church was built.', image: require('../../../assets/Peter.png') },
  { id: 'john', name: 'John', description: 'Beloved disciple, author of the Gospel and Revelation.', image: require('../../../assets/John.png') },
  { id: 'jeremiah', name: 'Jeremiah', description: 'Weeping prophet who foretold the fall of Jerusalem.', image: require('../../../assets/Jeremiah.png') },
  { id: 'moses', name: 'Moses', description: 'Deliverer of Israel, receiver of the Law.', image: require('../../../assets/Moses.png') },
  { id: 'david', name: 'David', description: 'Shepherd king, man after God\'s own heart.', image: require('../../../assets/David.png') },
  { id: 'solomon', name: 'Solomon', description: 'Wisest king, builder of the Temple.', image: require('../../../assets/Solomon.png') },
  { id: 'isaiah', name: 'Isaiah', description: 'Prophet of comfort and the coming Messiah.', image: require('../../../assets/Isaiah.png') },
  { id: 'daniel', name: 'Daniel', description: 'Faithful in exile, interpreter of dreams.', image: require('../../../assets/Daniel.png') },
  { id: 'jesus', name: 'The Son of God', description: 'The Christ, Son of God, Savior of the world.', image: require('../../../assets/Jesus.png') },
] as const;

export const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: 'onboarding_completed',
  DAILY_DELIVERY_TIME: 'daily_delivery_time',
  ANONYMOUS_MODE: 'anonymous_mode',
  SEEN_VIDEOS: 'seen_videos',
  DAILY_SELECTION_PREFIX: 'daily_selection_',
} as const;
