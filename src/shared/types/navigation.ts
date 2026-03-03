import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type OnboardingStackParamList = {
  Onboarding: undefined;
  TimePicker: undefined;
};

export type MainTabParamList = {
  DailyEncounter: undefined;
  Characters: undefined;
  Settings: undefined;
};

export type CharactersStackParamList = {
  Gallery: undefined;
  CharacterDetail: { characterId: string };
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
  Auth: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

export type OnboardingScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'Onboarding'
>;
export type TimePickerScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'TimePicker'
>;
export type CharacterDetailScreenProps = NativeStackScreenProps<
  CharactersStackParamList,
  'CharacterDetail'
>;
