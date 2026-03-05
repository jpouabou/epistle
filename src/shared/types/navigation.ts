import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type OnboardingStackParamList = {
  Arrival: undefined;
  Invitation: undefined;
  ChooseHour: undefined;
  NotificationPermission: undefined;
  WitnessTransition: undefined;
  SampleIntro: undefined;
  SamplePlayback: undefined;
  Paywall: undefined;
  Onboarding: undefined;
};

export type MainTabParamList = {
  DailyEncounter: undefined;
  Characters: undefined;
  Visitations: undefined;
  Settings: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  Paywall: undefined;
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

export type ArrivalScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'Arrival'
>;
export type InvitationScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'Invitation'
>;
export type ChooseHourScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'ChooseHour'
>;
export type NotificationPermissionScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'NotificationPermission'
>;
export type WitnessTransitionScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'WitnessTransition'
>;
export type OnboardingScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'Onboarding'
>;
export type CharacterDetailScreenProps = NativeStackScreenProps<
  CharactersStackParamList,
  'CharacterDetail'
>;
